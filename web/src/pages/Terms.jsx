import BrandLogo from '../components/BrandLogo';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BrandLogo sizeClass="h-12" showText />
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
          >
             Back to dashboard
          </Link>
        </div>
        <div className="space-y-6 text-sm leading-relaxed text-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">MaidMatch Uganda  Terms &amp; Conditions</h1>
            <p className="text-xs text-gray-500">Last Updated: 1 Dec 2025</p>
            <p className="text-xs text-gray-500 mt-1">Applies to: Mobile app, web app, and all MaidMatch services.</p>
          </div>

          <p>
            These Terms &amp; Conditions (cTermsd) govern your use of MaidMatch Uganda (cMaidMatchd, cwed, courd, 
            cusd). By registering or using the platform, you agree to be bound by these Terms. If you do not agree, do not use MaidMatch.
          </p>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">1. About MaidMatch</h2>
            <p>MaidMatch is a digital platform that connects:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Homeowners / Clients seeking domestic workers</li>
              <li>Maids (domestic helpers for daily, weekly, or long-term work)</li>
              <li>Cleaning companies / professional cleaning providers</li>
              <li>Home nurse / home care service providers</li>
            </ul>
            <p className="mt-2">
              MaidMatch does not employ any service provider (maids, cleaners, agencies, or nurses). All providers operate as
              independent contractors or independent companies. We only provide:
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>A matching and listing platform</li>
              <li>Booking tools</li>
              <li>Communication and scheduling tools</li>
              <li>Rating &amp; review tools</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">2. Eligibility</h2>
            <p>To use MaidMatch you must:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Be legally able to enter a contract</li>
              <li>Use real and verifiable information</li>
            </ul>
            <p className="mt-2">
              Businesses (cleaning companies or nurse service agencies) must provide accurate business details and are fully
              responsible for their staff.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">3. User Account Types</h2>
            <p>MaidMatch supports four account categories:</p>
            <p className="mt-1 font-medium">3.1 Homeowners / Clients</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Create job requests</li>
              <li>View available helpers and services</li>
              <li>Book and manage appointments</li>
              <li>Rate and review providers</li>
            </ul>
            <p className="mt-2 font-medium">3.2 Maids (Domestic Helpers)</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Create professional profiles</li>
              <li>Advertise services (cleaning, childcare, laundry, cooking, etc.)</li>
              <li>Accept jobs and manage work schedules</li>
            </ul>
            <p className="mt-2 font-medium">3.3 Cleaning Companies</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Register as a business profile</li>
              <li>Offer specialized or advanced cleaning services</li>
              <li>Manage bookings and staff assignments</li>
            </ul>
            <p className="mt-2 font-medium">3.4 Home Nurse / Caregiver Providers</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Offer in-home medical or non-medical care</li>
              <li>Display certifications where required</li>
              <li>Manage client visits</li>
            </ul>
            <p className="mt-2 font-medium">Account Responsibilities for All Users</p>
            <p>You agree to:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Provide accurate information</li>
              <li>Update your details when they change</li>
              <li>Keep login credentials secure</li>
              <li>Use the platform honestly and responsibly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">4. Bookings &amp; Service Agreements</h2>
            <p>All bookings should be done through the platform. By booking or accepting a job, you agree that:</p>
            <p className="mt-2 font-medium">4.1 MaidMatch is NOT a party to the contract</p>
            <p>
              The service contract is strictly between Client and Maid, Client and Cleaning Company, or Client and Home Nurse
              Service Provider.
            </p>
            <p className="mt-2 font-medium">4.2 Service Providers Must:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Arrive on time</li>
              <li>Perform skilled and safe work</li>
              <li>Respect the clients home</li>
              <li>Maintain professionalism</li>
            </ul>
            <p className="mt-2 font-medium">4.3 Clients Must:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Provide a safe and respectful working environment</li>
              <li>Clearly describe the required services</li>
              <li>Pay the provider as agreed</li>
              <li>Not request illegal or unsafe work</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">5. Fees &amp; Payments</h2>
            <p className="font-medium mt-1">5.1 For Clients</p>
            <p>
              Some services may be subject to booking fees. Payment for work is made directly between client and provider unless
              MaidMatch introduces secure payment options in the future.
            </p>
            <p className="font-medium mt-2">5.2 For Maids, Companies &amp; Nurses</p>
            <p>
              Listing is currently free unless a subscription system is introduced. Service providers are responsible for their
              own pricing.
            </p>
            <p className="font-medium mt-2">5.3 Disputes</p>
            <p>
              MaidMatch is not liable for disagreements over payment, quality of service issues, or damages, losses, or
              misconduct by providers. We may assist with mediation when possible but do not guarantee outcomes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">6. Cancellation Policy</h2>
            <p className="font-medium mt-1">Clients:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Should cancel through the app</li>
              <li>Frequent cancellations may lead to restrictions</li>
            </ul>
            <p className="font-medium mt-2">Service Providers:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Must honour confirmed bookings</li>
              <li>Repeated no-shows may lead to suspension</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">7. Reviews &amp; Ratings</h2>
            <p>Ratings must be truthful and respectful. Hateful, false, or defamatory reviews are prohibited.</p>
            <p>MaidMatch may edit or remove inappropriate reviews.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">8. Prohibited Activities</h2>
            <p>All users are prohibited from:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Harassment, discrimination, or abusive behaviour</li>
              <li>Fraud or identity misrepresentation</li>
              <li>Exploitation of workers</li>
              <li>Illegal services</li>
              <li>Attempting to bypass or misuse the platform</li>
              <li>Posting false information</li>
              <li>Uploading harmful content</li>
            </ul>
            <p className="mt-2">Violations may result in permanent account termination.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">9. Background Checks</h2>
            <p>
              MaidMatch may perform optional verification checks and request documentation (IDs, certificates, etc.), but does
              not guarantee full background or criminal checks. Clients and providers must exercise personal judgment and due
              diligence.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">10. Liability Limitations</h2>
            <p>You agree that MaidMatch is not responsible for:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Personal disputes</li>
              <li>Theft, damages, or injury</li>
              <li>Unprofessional behaviour by a user</li>
              <li>Service-related accidents</li>
              <li>Payment disagreements</li>
              <li>Delays or cancellations</li>
            </ul>
            <p className="mt-2">The platform is used at your own risk.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">11. Intellectual Property</h2>
            <p>
              All software, designs, trademarks, logos, and content belong to MaidMatch Uganda. Users may not copy, modify, sell,
              distribute, or reverse engineer any part of the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">12. Privacy</h2>
            <p>
              Your use of the platform is also governed by the MaidMatch Privacy Policy. We comply with the Uganda Data
              Protection and Privacy Act, 2019.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">13. Account Termination</h2>
            <p>We may suspend or delete accounts for misconduct, fraud, harassment, or violations of these Terms.</p>
            <p>Users may delete their accounts at any time.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">14. Changes to Terms</h2>
            <p>
              We may update these Terms as the platform grows. You will be notified of major changes. Continued use means
              acceptance of updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">15. Governing Law</h2>
            <p>These Terms are governed by the laws of Uganda and any disputes will be resolved according to Ugandan law.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">16. Contact Information</h2>
            <p className="space-y-1">
              <span>For support, questions, or complaints:</span>
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Email: support@maidmatchug.org</li>
              <li>Phone: +256 778934413</li>
              <li>Location: Kampala, Uganda</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
