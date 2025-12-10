from decimal import Decimal
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from decouple import config
import requests
from maid.models import MaidProfile
from homeowner.models import HomeownerProfile
from cleaning_company.models import CleaningCompany
from home_nursing.models import HomeNurse
from .models import MobileMoneyTransaction


class MaidOnboardingInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not hasattr(user, "maid_profile"):
            return Response({"error": "Only maids can pay the onboarding fee."}, status=status.HTTP_400_BAD_REQUEST)

        maid = user.maid_profile
        # Hard lock: if maid has already paid (or we already recorded success), do not allow another charge
        if getattr(maid, "onboarding_fee_paid", False):
            return Response({"error": "Onboarding fee already paid."}, status=status.HTTP_400_BAD_REQUEST)

        # Also prevent duplicate in-flight payments
        existing_tx = MobileMoneyTransaction.objects.filter(
            maid=maid,
            status__in=[
                MobileMoneyTransaction.STATUS_PENDING,
                MobileMoneyTransaction.STATUS_SUCCESS,
            ],
        ).exists()
        if existing_tx:
            return Response(
                {"error": "You already have an onboarding payment in progress or completed. If this looks wrong, contact support."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        network = str(request.data.get("network", "")).lower()
        phone_number = str(request.data.get("phone_number", "")).strip()
        if network not in {MobileMoneyTransaction.NETWORK_MTN, MobileMoneyTransaction.NETWORK_AIRTEL}:
            return Response({"error": "Invalid network. Choose MTN or Airtel."}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal("5000.00")

        tx = MobileMoneyTransaction.objects.create(
            maid=maid,
            network=network,
            phone_number=phone_number,
            amount=amount,
            purpose=MobileMoneyTransaction.PURPOSE_MAID_ONBOARDING,
        )

        pesapal_key = config("PESAPAL_CONSUMER_KEY", default="")
        pesapal_secret = config("PESAPAL_CONSUMER_SECRET", default="")
        ipn_id = config("PESAPAL_IPN_ID", default="6ebfe1ed-3b45-4c19-89e6-dafef0f898ea")
        if not pesapal_key or not pesapal_secret:
            return Response({"error": "Payment configuration missing on server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 1: obtain bearer token
        auth_url = "https://pay.pesapal.com/v3/api/Auth/RequestToken"
        try:
            auth_resp = requests.post(
                auth_url,
                json={
                    "consumer_key": pesapal_key,
                    "consumer_secret": pesapal_secret,
                },
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            auth_data = auth_resp.json() if auth_resp.content else {}
        except Exception as exc:  # pragma: no cover - network failure
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to contact payment gateway."}, status=status.HTTP_502_BAD_GATEWAY)

        token = auth_data.get("token")
        if not token or auth_resp.status_code != 200:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to authenticate with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        # Step 2: submit order request
        submit_url = "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest"
        merchant_reference = f"MM-ONBOARD-{tx.id}"
        callback_url = config(
            "PESAPAL_CALLBACK_URL",
            default="https://maidmatch.pythonanywhere.com/pesapal/payment-complete/",
        )
        # Note: currency must be a valid ISO currency code; for Uganda we use UGX
        body = {
            "id": merchant_reference,
            "currency": "UGX",
            "amount": float(amount),
            "description": "MaidMatch onboarding fee (UGX 5,000)",
            "callback_url": callback_url,
            "redirect_mode": 0,
            "notification_id": ipn_id,
            "branch": "MaidMatch",
            "billing_address": {
                "email_address": getattr(maid, "email", "") or getattr(maid.user, "email", ""),
                "phone_number": phone_number,
                "country_code": "UG",  # Uganda
                "first_name": getattr(maid.user, "first_name", "") or "Maid",
                "middle_name": "",
                "last_name": getattr(maid.user, "last_name", "") or str(maid.user.username),
                "line_1": maid.location or "",
                "line_2": "",
                "city": "",
                "state": "",
                "postal_code": "",
                "zip_code": "",
            },
        }

        try:
            submit_resp = requests.post(
                submit_url,
                json=body,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                timeout=20,
            )
            submit_data = submit_resp.json() if submit_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to create payment with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        order_tracking_id = submit_data.get("order_tracking_id")
        redirect_url = submit_data.get("redirect_url")
        if submit_resp.status_code != 200 or not order_tracking_id:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.raw_callback = submit_data
            tx.save(update_fields=["status", "raw_callback"])
            return Response({"error": "Payment gateway did not accept the request."}, status=status.HTTP_502_BAD_GATEWAY)

        tx.provider_reference = order_tracking_id
        tx.raw_callback = submit_data
        tx.save(update_fields=["provider_reference", "raw_callback"])

        return Response(
            {
                "status": "pending",
                "message": "We have sent your payment request to Pesapal. If Mobile Money is available for your number, you should receive a prompt on your phone to enter your PIN.",
                "transaction_id": tx.id,
                "order_tracking_id": order_tracking_id,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_201_CREATED,
        )


class HomeNurseOnboardingInitiateView(APIView):
    """Initiate premium onboarding for home nurses (10k)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            nurse = HomeNurse.objects.get(user=user)
        except HomeNurse.DoesNotExist:
            return Response({"error": "Only home nurses can pay the onboarding fee."}, status=status.HTTP_400_BAD_REQUEST)

        if getattr(nurse, "onboarding_fee_paid", False):
            return Response({"error": "Onboarding fee already paid."}, status=status.HTTP_400_BAD_REQUEST)

        existing_tx = MobileMoneyTransaction.objects.filter(
            home_nurse=nurse,
            purpose=MobileMoneyTransaction.PURPOSE_HOME_NURSE_ONBOARDING,
            status__in=[
                MobileMoneyTransaction.STATUS_PENDING,
                MobileMoneyTransaction.STATUS_SUCCESS,
            ],
        ).exists()
        if existing_tx:
            return Response(
                {"error": "You already have an onboarding payment in progress or completed. If this looks wrong, contact support."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        network = str(request.data.get("network", "")).lower()
        phone_number = str(request.data.get("phone_number", "")).strip()
        if network not in {MobileMoneyTransaction.NETWORK_MTN, MobileMoneyTransaction.NETWORK_AIRTEL}:
            return Response({"error": "Invalid network. Choose MTN or Airtel."}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal("10000.00")

        tx = MobileMoneyTransaction.objects.create(
            home_nurse=nurse,
            network=network,
            phone_number=phone_number,
            amount=amount,
            purpose=MobileMoneyTransaction.PURPOSE_HOME_NURSE_ONBOARDING,
        )

        pesapal_key = config("PESAPAL_CONSUMER_KEY", default="")
        pesapal_secret = config("PESAPAL_CONSUMER_SECRET", default="")
        ipn_id = config("PESAPAL_IPN_ID", default="6ebfe1ed-3b45-4c19-89e6-dafef0f898ea")
        if not pesapal_key or not pesapal_secret:
            return Response({"error": "Payment configuration missing on server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        auth_url = "https://pay.pesapal.com/v3/api/Auth/RequestToken"
        try:
            auth_resp = requests.post(
                auth_url,
                json={"consumer_key": pesapal_key, "consumer_secret": pesapal_secret},
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=15,
            )
            auth_data = auth_resp.json() if auth_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to contact payment gateway."}, status=status.HTTP_502_BAD_GATEWAY)

        token = auth_data.get("token")
        if not token or auth_resp.status_code != 200:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to authenticate with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        submit_url = "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest"
        merchant_reference = f"HN-ONBOARD-{tx.id}"
        callback_url = config(
            "PESAPAL_CALLBACK_URL",
            default="https://maidmatch.pythonanywhere.com/pesapal/payment-complete/",
        )
        body = {
            "id": merchant_reference,
            "currency": "UGX",
            "amount": float(amount),
            "description": "MaidMatch home nurse premium onboarding fee (UGX 10,000)",
            "callback_url": callback_url,
            "redirect_mode": 0,
            "notification_id": ipn_id,
            "branch": "MaidMatch",
            "billing_address": {
                "email_address": getattr(user, "email", ""),
                "phone_number": phone_number,
                "country_code": "UG",
                "first_name": getattr(user, "first_name", "") or "Nurse",
                "middle_name": "",
                "last_name": getattr(user, "last_name", "") or str(user.username),
                "line_1": nurse.location or "",
                "line_2": "",
                "city": "",
                "state": "",
                "postal_code": "",
                "zip_code": "",
            },
        }

        try:
            submit_resp = requests.post(
                submit_url,
                json=body,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                timeout=20,
            )
            submit_data = submit_resp.json() if submit_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to create payment with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        order_tracking_id = submit_data.get("order_tracking_id")
        redirect_url = submit_data.get("redirect_url")
        if submit_resp.status_code != 200 or not order_tracking_id:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.raw_callback = submit_data
            tx.save(update_fields=["status", "raw_callback"])
            return Response({"error": "Payment gateway did not accept the request."}, status=status.HTTP_502_BAD_GATEWAY)

        tx.provider_reference = order_tracking_id
        tx.raw_callback = submit_data
        tx.save(update_fields=["provider_reference", "raw_callback"])

        return Response(
            {
                "status": "pending",
                "message": "We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.",
                "transaction_id": tx.id,
                "order_tracking_id": order_tracking_id,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_201_CREATED,
        )


class HomeownerPaymentInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not hasattr(user, "homeowner_profile"):
            return Response({"error": "Only homeowners can use this payment option."}, status=status.HTTP_400_BAD_REQUEST)

        plan = str(request.data.get("plan", "")).lower()
        network = str(request.data.get("network", "")).lower()
        phone_number = str(request.data.get("phone_number", "")).strip()

        if network not in {MobileMoneyTransaction.NETWORK_MTN, MobileMoneyTransaction.NETWORK_AIRTEL}:
            return Response({"error": "Invalid network. Choose MTN or Airtel."}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        homeowner = user.homeowner_profile

        # Determine amount and purpose based on plan
        if plan == "live_in":
            amount = Decimal("25000.00")
            purpose = MobileMoneyTransaction.PURPOSE_HOMEOWNER_LIVE_IN
            merchant_prefix = "HM-LIVE-"
            description = "MaidMatch homeowner live-in placement fee (UGX 25,000)"
        elif plan == "monthly":
            amount = Decimal("20000.00")
            purpose = MobileMoneyTransaction.PURPOSE_HOMEOWNER_MONTHLY
            merchant_prefix = "HM-MONTH-"
            description = "MaidMatch homeowner monthly subscription (UGX 20,000)"
        elif plan == "day_pass":
            amount = Decimal("5000.00")
            purpose = MobileMoneyTransaction.PURPOSE_HOMEOWNER_DAY_PASS
            merchant_prefix = "HM-DAY-"
            description = "MaidMatch homeowner 24 hour access pass (UGX 5,000)"
        else:
            return Response({"error": "Invalid plan. Use live_in, monthly or day_pass."}, status=status.HTTP_400_BAD_REQUEST)

        tx = MobileMoneyTransaction.objects.create(
            homeowner=homeowner,
            network=network,
            phone_number=phone_number,
            amount=amount,
            purpose=purpose,
        )

        pesapal_key = config("PESAPAL_CONSUMER_KEY", default="")
        pesapal_secret = config("PESAPAL_CONSUMER_SECRET", default="")
        ipn_id = config("PESAPAL_IPN_ID", default="6ebfe1ed-3b45-4c19-89e6-dafef0f898ea")
        if not pesapal_key or not pesapal_secret:
            return Response({"error": "Payment configuration missing on server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 1: obtain bearer token
        auth_url = "https://pay.pesapal.com/v3/api/Auth/RequestToken"
        try:
            auth_resp = requests.post(
                auth_url,
                json={
                    "consumer_key": pesapal_key,
                    "consumer_secret": pesapal_secret,
                },
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            auth_data = auth_resp.json() if auth_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to contact payment gateway."}, status=status.HTTP_502_BAD_GATEWAY)

        token = auth_data.get("token")
        if not token or auth_resp.status_code != 200:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to authenticate with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        # Step 2: submit order request
        submit_url = "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest"
        merchant_reference = f"{merchant_prefix}{tx.id}"
        callback_url = config(
            "PESAPAL_CALLBACK_URL",
            default="https://maidmatch.pythonanywhere.com/pesapal/payment-complete/",
        )
        body = {
            "id": merchant_reference,
            "currency": "UGX",
            "amount": float(amount),
            "description": description,
            "callback_url": callback_url,
            "redirect_mode": 0,
            "notification_id": ipn_id,
            "branch": "MaidMatch",
            "billing_address": {
                "email_address": getattr(user, "email", ""),
                "phone_number": phone_number,
                "country_code": "UG",
                "first_name": getattr(user, "first_name", "") or "Homeowner",
                "middle_name": "",
                "last_name": getattr(user, "last_name", "") or str(user.username),
                "line_1": homeowner.home_address or "",
                "line_2": "",
                "city": "",
                "state": "",
                "postal_code": "",
                "zip_code": "",
            },
        }

        try:
            submit_resp = requests.post(
                submit_url,
                json=body,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                timeout=20,
            )
            submit_data = submit_resp.json() if submit_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to create payment with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        order_tracking_id = submit_data.get("order_tracking_id")
        redirect_url = submit_data.get("redirect_url")
        if submit_resp.status_code != 200 or not order_tracking_id:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.raw_callback = submit_data
            tx.save(update_fields=["status", "raw_callback"])
            return Response({"error": "Payment gateway did not accept the request."}, status=status.HTTP_502_BAD_GATEWAY)

        tx.provider_reference = order_tracking_id
        tx.raw_callback = submit_data
        tx.save(update_fields=["provider_reference", "raw_callback"])

        return Response(
            {
                "status": "pending",
                "message": "We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.",
                "transaction_id": tx.id,
                "order_tracking_id": order_tracking_id,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_201_CREATED,
        )


class CleaningCompanyPaymentInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            company = CleaningCompany.objects.get(user=user)
        except CleaningCompany.DoesNotExist:
            return Response({"error": "Only cleaning companies can use this payment option."}, status=status.HTTP_400_BAD_REQUEST)

        plan = str(request.data.get("plan", "")).lower()
        network = str(request.data.get("network", "")).lower()
        phone_number = str(request.data.get("phone_number", "")).strip()

        if network not in {MobileMoneyTransaction.NETWORK_MTN, MobileMoneyTransaction.NETWORK_AIRTEL}:
            return Response({"error": "Invalid network. Choose MTN or Airtel."}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine amount and purpose based on plan
        if plan == "monthly":
            amount = Decimal("30000.00")
            purpose = MobileMoneyTransaction.PURPOSE_COMPANY_MONTHLY
            merchant_prefix = "CC-MONTH-"
            description = "MaidMatch cleaning company monthly plan (UGX 30,000)"
        elif plan == "annual":
            # 12 * 30,000 with 5% discount = 342,000
            amount = Decimal("342000.00")
            purpose = MobileMoneyTransaction.PURPOSE_COMPANY_ANNUAL
            merchant_prefix = "CC-ANNUAL-"
            description = "MaidMatch cleaning company annual plan (UGX 342,000, 5% off)"
        else:
            return Response({"error": "Invalid plan. Use monthly or annual."}, status=status.HTTP_400_BAD_REQUEST)

        tx = MobileMoneyTransaction.objects.create(
            company=company,
            network=network,
            phone_number=phone_number,
            amount=amount,
            purpose=purpose,
        )

        pesapal_key = config("PESAPAL_CONSUMER_KEY", default="")
        pesapal_secret = config("PESAPAL_CONSUMER_SECRET", default="")
        ipn_id = config("PESAPAL_IPN_ID", default="6ebfe1ed-3b45-4c19-89e6-dafef0f898ea")
        if not pesapal_key or not pesapal_secret:
            return Response({"error": "Payment configuration missing on server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 1: obtain bearer token
        auth_url = "https://pay.pesapal.com/v3/api/Auth/RequestToken"
        try:
            auth_resp = requests.post(
                auth_url,
                json={
                    "consumer_key": pesapal_key,
                    "consumer_secret": pesapal_secret,
                },
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            auth_data = auth_resp.json() if auth_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to contact payment gateway."}, status=status.HTTP_502_BAD_GATEWAY)

        token = auth_data.get("token")
        if not token or auth_resp.status_code != 200:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to authenticate with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        # Step 2: submit order request
        submit_url = "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest"
        merchant_reference = f"{merchant_prefix}{tx.id}"
        callback_url = config(
            "PESAPAL_CALLBACK_URL",
            default="https://maidmatch.pythonanywhere.com/pesapal/payment-complete/",
        )
        body = {
            "id": merchant_reference,
            "currency": "UGX",
            "amount": float(amount),
            "description": description,
            "callback_url": callback_url,
            "redirect_mode": 0,
            "notification_id": ipn_id,
            "branch": "MaidMatch",
            "billing_address": {
                "email_address": getattr(user, "email", ""),
                "phone_number": phone_number,
                "country_code": "UG",
                "first_name": getattr(user, "first_name", "") or "Company",
                "middle_name": "",
                "last_name": getattr(user, "last_name", "") or str(user.username),
                "line_1": company.location or "",
                "line_2": "",
                "city": "",
                "state": "",
                "postal_code": "",
                "zip_code": "",
            },
        }

        try:
            submit_resp = requests.post(
                submit_url,
                json=body,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                timeout=20,
            )
            submit_data = submit_resp.json() if submit_resp.content else {}
        except Exception:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.save(update_fields=["status"])
            return Response({"error": "Failed to create payment with Pesapal."}, status=status.HTTP_502_BAD_GATEWAY)

        order_tracking_id = submit_data.get("order_tracking_id")
        redirect_url = submit_data.get("redirect_url")
        if submit_resp.status_code != 200 or not order_tracking_id:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.raw_callback = submit_data
            tx.save(update_fields=["status", "raw_callback"])
            return Response({"error": "Payment gateway did not accept the request."}, status=status.HTTP_502_BAD_GATEWAY)

        tx.provider_reference = order_tracking_id
        tx.raw_callback = submit_data
        tx.save(update_fields=["provider_reference", "raw_callback"])

        return Response(
            {
                "status": "pending",
                "message": "We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.",
                "transaction_id": tx.id,
                "order_tracking_id": order_tracking_id,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_201_CREATED,
        )


class PesapalIPNView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        # Pesapal may call the IPN URL using GET depending on registration
        return self._handle_ipn(request)

    def post(self, request):
        return self._handle_ipn(request)

    def _handle_ipn(self, request):
        # IPN can be GET or POST; support both.
        data = request.data or {}
        order_tracking_id = data.get("OrderTrackingId") or request.query_params.get("OrderTrackingId")
        merchant_reference = data.get("OrderMerchantReference") or request.query_params.get("OrderMerchantReference")

        if not order_tracking_id and not merchant_reference:
            return Response({"detail": "Missing order reference"}, status=status.HTTP_400_BAD_REQUEST)

        tx = None
        if order_tracking_id:
            tx = MobileMoneyTransaction.objects.filter(provider_reference=order_tracking_id).first()
        # Resolve by merchant reference prefix if needed
        if not tx and merchant_reference:
            try:
                if merchant_reference.startswith("MM-ONBOARD-") or merchant_reference.startswith("HN-ONBOARD-"):
                    tx_id = int(merchant_reference.split("-")[-1])
                    tx = MobileMoneyTransaction.objects.filter(id=tx_id).first()
                elif merchant_reference.startswith("HM-LIVE-") or merchant_reference.startswith("HM-MONTH-") or merchant_reference.startswith("HM-DAY-") or merchant_reference.startswith("CC-MONTH-") or merchant_reference.startswith("CC-ANNUAL-"):
                    # All homeowner and company payments also use transaction ID at the end
                    tx_id = int(merchant_reference.split("-")[-1])
                    tx = MobileMoneyTransaction.objects.filter(id=tx_id).first()
            except (TypeError, ValueError):
                tx = None

        if not tx:
            return Response({"detail": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        tx.raw_callback = data

        # Query Pesapal for the latest status
        pesapal_key = config("PESAPAL_CONSUMER_KEY", default="")
        pesapal_secret = config("PESAPAL_CONSUMER_SECRET", default="")
        if not pesapal_key or not pesapal_secret:
            tx.save(update_fields=["raw_callback"])
            return Response({"detail": "Payment config missing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        auth_url = "https://pay.pesapal.com/v3/api/Auth/RequestToken"
        try:
            auth_resp = requests.post(
                auth_url,
                json={"consumer_key": pesapal_key, "consumer_secret": pesapal_secret},
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=15,
            )
            auth_data = auth_resp.json() if auth_resp.content else {}
            token = auth_data.get("token")
        except Exception:
            token = None

        if not token:
            tx.save(update_fields=["raw_callback"])
            return Response({"detail": "Could not authenticate with Pesapal"}, status=status.HTTP_502_BAD_GATEWAY)

        status_url = "https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus"  # orderTrackingId passed as query param
        try:
            resp = requests.get(
                status_url,
                params={"orderTrackingId": order_tracking_id or tx.provider_reference},
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                timeout=15,
            )
            status_data = resp.json() if resp.content else {}
        except Exception:
            status_data = {}

        payment_status = (status_data.get("payment_status") or "").upper()
        if payment_status in {"COMPLETED", "COMPLETED_SUCCESSFULLY", "SUCCESS"}:
            tx.status = MobileMoneyTransaction.STATUS_SUCCESS
            tx.completed_at = timezone.now()

            # Apply effects based on purpose
            if tx.purpose == MobileMoneyTransaction.PURPOSE_MAID_ONBOARDING and tx.maid_id:
                maid = tx.maid
                maid.onboarding_fee_paid = True
                maid.onboarding_fee_paid_at = timezone.now()
                maid.save(update_fields=["onboarding_fee_paid", "onboarding_fee_paid_at"])
            elif tx.purpose == MobileMoneyTransaction.PURPOSE_HOME_NURSE_ONBOARDING and tx.home_nurse_id:
                nurse = tx.home_nurse
                nurse.onboarding_fee_paid = True
                nurse.onboarding_fee_paid_at = timezone.now()
                nurse.save(update_fields=["onboarding_fee_paid", "onboarding_fee_paid_at"])
            elif tx.purpose == MobileMoneyTransaction.PURPOSE_HOMEOWNER_LIVE_IN and tx.homeowner_id:
                hp = tx.homeowner
                hp.has_live_in_credit = True
                hp.live_in_credit_awarded_at = timezone.now()
                hp.save(update_fields=["has_live_in_credit", "live_in_credit_awarded_at"])
            elif tx.purpose in {MobileMoneyTransaction.PURPOSE_HOMEOWNER_MONTHLY, MobileMoneyTransaction.PURPOSE_HOMEOWNER_DAY_PASS} and tx.homeowner_id:
                hp = tx.homeowner
                from datetime import timedelta

                now = timezone.now()
                if tx.purpose == MobileMoneyTransaction.PURPOSE_HOMEOWNER_MONTHLY:
                    hp.subscription_type = HomeownerProfile.SUB_MONTHLY
                    hp.subscription_expires_at = now + timedelta(days=30)
                else:
                    hp.subscription_type = HomeownerProfile.SUB_DAY_PASS
                    hp.subscription_expires_at = now + timedelta(days=1)
                hp.save(update_fields=["subscription_type", "subscription_expires_at"])
            elif tx.purpose in {MobileMoneyTransaction.PURPOSE_COMPANY_MONTHLY, MobileMoneyTransaction.PURPOSE_COMPANY_ANNUAL} and tx.company_id:
                from datetime import timedelta

                company = tx.company
                now = timezone.now()
                company.has_active_subscription = True
                if tx.purpose == MobileMoneyTransaction.PURPOSE_COMPANY_MONTHLY:
                    company.subscription_type = "monthly"
                    company.subscription_expires_at = now + timedelta(days=30)
                else:
                    company.subscription_type = "annual"
                    company.subscription_expires_at = now + timedelta(days=365)
                company.save(update_fields=["has_active_subscription", "subscription_type", "subscription_expires_at"])
        elif payment_status in {"FAILED", "CANCELLED", "CANCELED"}:
            tx.status = MobileMoneyTransaction.STATUS_FAILED
            tx.completed_at = timezone.now()

        tx.raw_callback = {"ipn": data, "status": status_data}
        tx.save(update_fields=["status", "completed_at", "raw_callback"])
        return Response({"detail": "OK"})
