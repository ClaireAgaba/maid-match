# ✅ Maid Verification Status Banners - COMPLETE!

## 🎯 **Overview**

Added **verification status banners** to the maid dashboard to clearly show whether their account is verified, pending verification, or disabled.

---

## 🎨 **Three Banner Types**

### **1. Pending Verification Banner** ⚠️ (Yellow)
**Shows when:** Account is not yet verified

```
┌─────────────────────────────────────────────┐
│ 🛡️  Account Pending Verification            │
│                                             │
│ Your account is currently under review.     │
│ Please ensure you have uploaded all         │
│ required documents (ID and certificates)    │
│ in your profile settings. Once verified,    │
│ you'll be able to apply for jobs.          │
│                                             │
│ [Complete Your Profile →]                   │
└─────────────────────────────────────────────┘
```

**Features:**
- Yellow background with yellow border
- Shield icon
- Clear explanation
- Link to profile settings
- Encourages document upload

---

### **2. Verified Banner** ✓ (Blue)
**Shows when:** Account is verified by admin

```
┌─────────────────────────────────────────────┐
│ 🛡️✓  ✓ Account Verified                     │
│                                             │
│ Your account has been verified by our       │
│ admin team. You can now browse and apply    │
│ for jobs!                                   │
└─────────────────────────────────────────────┘
```

**Features:**
- Blue background with blue border
- ShieldCheck icon
- Positive confirmation message
- Encourages job browsing

---

### **3. Account Disabled Banner** 🚫 (Red)
**Shows when:** Account is disabled by admin

```
┌─────────────────────────────────────────────┐
│ 🚫  Account Disabled                        │
│                                             │
│ Your account has been temporarily disabled. │
│ Please contact support for more information.│
│                                             │
│ Reason: [Admin's disable reason]            │
└─────────────────────────────────────────────┘
```

**Features:**
- Red background with red border
- Ban icon
- Shows disable reason (if provided)
- Directs to contact support

---

## 📍 **Banner Placement**

Banners appear at the **top of the dashboard**, right after the welcome message and before the profile card:

```
┌─────────────────────────────────────┐
│ Welcome back, maid1!                │
│ Browse available jobs...            │
├─────────────────────────────────────┤
│ [⚠️ VERIFICATION BANNER HERE]       │
├─────────────────────────────────────┤
│ Profile Card                        │
│ [Photo] Name, Location              │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## 🎯 **Display Logic**

### **Priority Order:**
1. **Disabled Banner** (Highest priority)
   - If `is_enabled = false`, show red banner
   - Overrides other banners

2. **Verified Banner**
   - If `is_verified = true` AND `is_enabled = true`
   - Show blue banner

3. **Pending Verification Banner**
   - If `is_verified = false` AND `is_enabled = true`
   - Show yellow banner

### **Code Logic:**
```javascript
// Disabled takes priority
{!maidProfile.is_enabled && (
  <RedDisabledBanner />
)}

// Then verified
{maidProfile.is_verified && maidProfile.is_enabled && (
  <BlueVerifiedBanner />
)}

// Then pending
{!maidProfile.is_verified && maidProfile.is_enabled && (
  <YellowPendingBanner />
)}
```

---

## 💻 **Technical Implementation**

### **Banner Component Structure:**
```jsx
<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
  <div className="flex">
    <div className="flex-shrink-0">
      <Shield className="h-5 w-5 text-yellow-400" />
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-yellow-800">
        Account Pending Verification
      </h3>
      <div className="mt-2 text-sm text-yellow-700">
        <p>Message text...</p>
      </div>
      <div className="mt-4">
        <button onClick={() => navigate('/profile-settings')}>
          Complete Your Profile →
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 **Color Schemes**

### **Pending (Yellow):**
- Background: `bg-yellow-50`
- Border: `border-yellow-400`
- Icon: `text-yellow-400`
- Title: `text-yellow-800`
- Text: `text-yellow-700`

### **Verified (Blue):**
- Background: `bg-blue-50`
- Border: `border-blue-400`
- Icon: `text-blue-400`
- Title: `text-blue-800`
- Text: `text-blue-700`

### **Disabled (Red):**
- Background: `bg-red-50`
- Border: `border-red-400`
- Icon: `text-red-400`
- Title: `text-red-800`
- Text: `text-red-700`

---

## 📋 **User Journey**

### **New Maid Registration:**
```
1. Maid registers account
   → Shows: Yellow "Pending Verification" banner
   → Action: Upload documents

2. Maid uploads ID and certificates
   → Still shows: Yellow banner
   → Waiting for admin review

3. Admin verifies account
   → Shows: Blue "Account Verified" banner
   → Action: Browse jobs!

4. Maid can now apply for jobs ✅
```

### **Account Disabled:**
```
1. Admin disables account
   → Shows: Red "Account Disabled" banner
   → Shows reason if provided

2. Maid contacts support
   → Issue resolved

3. Admin enables account
   → Shows: Blue "Account Verified" banner
   → Maid can apply for jobs again ✅
```

---

## 🎯 **Benefits**

| Benefit | Impact |
|---------|--------|
| **Clear Status** | Maid knows exactly where they stand |
| **Actionable** | Links to complete profile |
| **Transparent** | Shows disable reason |
| **Encouraging** | Positive message when verified |
| **Visual** | Color-coded for quick understanding |
| **Informative** | Explains what to do next |

---

## 📱 **Responsive Design**

### **Desktop:**
- Full banner width
- All text visible
- Icons on left

### **Mobile:**
- Stacks vertically
- Text wraps naturally
- Icons remain visible
- Buttons stack

---

## 🔍 **Banner Messages**

### **Pending Verification:**
```
"Your account is currently under review. Please ensure 
you have uploaded all required documents (ID and 
certificates) in your profile settings. Once verified, 
you'll be able to apply for jobs."
```

### **Verified:**
```
"Your account has been verified by our admin team. 
You can now browse and apply for jobs!"
```

### **Disabled:**
```
"Your account has been temporarily disabled. Please 
contact support for more information."

Reason: [Admin's reason]
```

---

## 🧪 **Testing Scenarios**

### **Test 1: New Maid**
```
1. Register as new maid
2. Login to dashboard
3. Should see: Yellow "Pending Verification" banner
4. Click "Complete Your Profile"
5. Should navigate to profile settings
```

### **Test 2: Verified Maid**
```
1. Admin verifies maid account
2. Maid logs in
3. Should see: Blue "Account Verified" banner
4. No action button (already verified)
```

### **Test 3: Disabled Maid**
```
1. Admin disables maid account with reason
2. Maid logs in
3. Should see: Red "Account Disabled" banner
4. Should show disable reason
5. No action button (must contact support)
```

---

## ✅ **Status**

| Feature | Status |
|---------|--------|
| **Pending Banner** | ✅ Complete |
| **Verified Banner** | ✅ Complete |
| **Disabled Banner** | ✅ Complete |
| **Color Coding** | ✅ Complete |
| **Icons** | ✅ Complete |
| **Action Buttons** | ✅ Complete |
| **Responsive** | ✅ Complete |

---

## 🎯 **User Experience**

### **Before:**
- Maid doesn't know verification status
- No clear indication of account state
- Confusion about why can't apply for jobs

### **After:**
- ✅ Clear visual banner
- ✅ Knows exact status
- ✅ Understands what to do next
- ✅ Can take action immediately

---

## 💡 **Best Practices**

### **For Maids:**
1. ✅ Check dashboard for verification status
2. ✅ Upload all required documents
3. ✅ Wait for admin verification
4. ✅ Contact support if disabled

### **For System:**
1. ✅ Show status prominently
2. ✅ Provide clear actions
3. ✅ Explain reasons
4. ✅ Use color coding

---

## **Future Enhancements**

### **Possible Additions:**
- **Email Notifications** - When status changes
- **Progress Bar** - Show verification progress
- **Checklist** - Required documents checklist
- **Timeline** - Estimated verification time
- **Chat Support** - Direct support link
- **Push Notifications** - Mobile alerts

---

## **Maid Onboarding Payment (Pesapal Mobile Money)**

### **Overview**
- Added a one-time **onboarding payment** for maids, collected via **Pesapal Mobile Money** (MTN / Airtel).
- Amount: **UGX 5,000**.
- Purpose: helps cover verification and onboarding processing.

### **Where it appears (Maid Dashboard)**
- New **"Onboarding Payment"** card in the maid dashboard stats section:
  - Shows **"Not paid"** / **"Paid (UGX 5,000)"**.
  - If not paid, shows helper text: *"Pay a one-time onboarding fee of UGX 5,000 to help us verify your account."*
- A **"Pay UGX 5,000"** button opens a payment modal.

### **Payment Flow (Maid)**
1. Maid opens dashboard and sees **Onboarding Payment: Not paid**.
2. Clicks **"Pay UGX 5,000"**.
3. Modal appears:
   - Select **Network**: MTN Mobile Money / Airtel Money.
   - Enter **Mobile Money number** they are paying from.
4. On submit, the app:
   - Calls backend `POST /api/payments/maid-onboarding/initiate/`.
   - Backend creates a `MobileMoneyTransaction` and calls **Pesapal SubmitOrderRequest**.
   - Backend returns status + a **Pesapal `redirect_url`**.
5. Frontend automatically opens **Pesapal checkout in a new tab** using `redirect_url`.
6. On Pesapal page, maid selects provider and confirms payment.
7. MTN/Airtel sends a **Mobile Money PIN prompt** to the maid’s phone.
8. Once payment completes, Pesapal sends an **IPN callback** to `/api/payments/pesapal/ipn/`.
9. Backend verifies status with **GetTransactionStatus** and, if successful:
   - Marks `onboarding_fee_paid = True` and sets `onboarding_fee_paid_at` on `MaidProfile`.
   - Updates `MobileMoneyTransaction.status` to **successful**.

### **Fees & Accounting**
- Pesapal charges a **transaction fee** on each payment (visible in the Pesapal dashboard).
- Maid pays **UGX 5,000**; the net amount you receive is **UGX 5,000 minus Pesapal fees**.
- All transactions (including fees) are visible under **Pesapal → Transactions history**.

### **Technical Notes**
- Backend:
  - Model: `payments.models.MobileMoneyTransaction` (linked to `MaidProfile`).
  - Views: `MaidOnboardingInitiateView`, `PesapalIPNView`.
  - Uses **live Pesapal API v3** endpoints for Auth, SubmitOrderRequest, and GetTransactionStatus.
- Frontend:
  - Dashboard modal implemented in `web/src/pages/Dashboard.jsx`.
  - API helper: `paymentAPI.initiateMaidOnboarding` in `web/src/services/api.js`.
  - Automatically calls `window.open(redirect_url, '_blank')` on success.

---

**Verification status banners and onboarding payment are now fully wired to maid accounts.** 
**Maids can clearly see their status, pay their onboarding fee, and get verified.** 
**Payments are processed via Pesapal Mobile Money with full transaction history.** 
