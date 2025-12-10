import BrandLogo from '../components/BrandLogo';
import { Link } from 'react-router-dom';

const Privacy = () => {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">MaidMatch Privacy Policy</h1>
            <p className="text-xs text-gray-500">Last updated: 10 December 2025</p>
            <p className="text-xs text-gray-500 mt-1">Applies to: MaidMatch web app, mobile app, and all MaidMatch services.</p>
          </div>

          <p>
            MaidMatch ("we", "us", "our") connects homeowners with maids, home nurses and cleaning companies. This
            Privacy Policy explains how we collect, use, store and share your personal information when you use our
            services (the "Service"). By creating an account or using MaidMatch, you agree to this Privacy Policy.
          </p>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">1. Who this policy applies to</h2>
            <p>This policy applies to:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Homeowners who look for domestic or home-care services</li>
              <li>Maids who list their services and apply for jobs</li>
              <li>Home nurses who provide home-based nursing or care</li>
              <li>Cleaning companies that offer professional cleaning services</li>
              <li>Visitors to our website and apps</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">2. Information we collect</h2>
            <p className="mt-1 font-medium">2.1 Information you provide to us</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>
                <span className="font-medium">Account details:</span> name, username, phone number, email address, password or
                login PIN, and user type (homeowner, maid, home nurse, cleaning company, admin).
              </li>
              <li>
                <span className="font-medium">Homeowner profiles:</span> location / neighbourhood, some home details and
                preferences, profile photo (optional).
              </li>
              <li>
                <span className="font-medium">Maid profiles:</span> full name, date of birth, gender, profile photo,
                location, phone number, email, skills, experience, hourly rate, service pricing, availability status, bio,
                and verification documents (ID document / passport, reference letter or certificate).
              </li>
              <li>
                <span className="font-medium">Home nurse profiles:</span> nursing level, council registration number, date of
                birth, gender, location, contact details, experience, services offered, service pricing, and verification
                documents (ID document and nursing certificate).
              </li>
              <li>
                <span className="font-medium">Cleaning company profiles:</span> company name, location, services offered and
                starting prices, company logo / display photo, and business registration / owner ID document.
              </li>
              <li>
                <span className="font-medium">Jobs and bookings:</span> job descriptions, dates, times, home type, budget and
                location, plus preferences about the type of provider you want.
              </li>
              <li>
                <span className="font-medium">Support and feedback:</span> messages you send via Help &amp; Feedback, support
                tickets, and ratings or written reviews you leave about other users.
              </li>
              <li>
                <span className="font-medium">Payments:</span> when you pay onboarding fees or subscriptions we collect the
                mobile network (e.g. MTN, Airtel) and the mobile number you are paying from. We do <span className="font-semibold">not</span> see or
                store your Mobile Money PIN. Payments are processed by our payment partners.
              </li>
            </ul>

            <p className="mt-2 font-medium">2.2 Information we collect automatically</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>
                <span className="font-medium">Usage data:</span> pages you visit, buttons you click, time spent on screens,
                jobs you view, and interactions with features.
              </li>
              <li>
                <span className="font-medium">Device and log data:</span> IP address, device type, browser type, operating
                system, approximate location.
              </li>
              <li>
                <span className="font-medium">Location data (when enabled):</span> approximate or precise GPS coordinates when
                you allow location sharing, for example to help homeowners see nearby maids or to update a maid's or
                nurse's "current location".
              </li>
            </ul>

            <p className="mt-2 font-medium">2.3 Information from other sources</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Payment partners (e.g. status of a transaction, reference numbers).</li>
              <li>Verification partners, if we use third parties to help verify IDs or certificates.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">3. How we use your information</h2>
            <p className="mt-1 font-medium">3.1 To provide and improve MaidMatch</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Create and manage your account and profiles.</li>
              <li>Allow homeowners to post jobs and manage applications.</li>
              <li>Allow maids, nurses and companies to promote their services and manage availability.</li>
              <li>Show relevant matches based on your role, location and preferences.</li>
              <li>Display ratings, reviews and basic profile details to help users make informed decisions.</li>
              <li>Monitor performance, fix bugs and improve the Service.</li>
            </ul>

            <p className="mt-2 font-medium">3.2 Matching and discovery</p>
            <p>
              We use your information to help match the right providers with the right clients. For example, a homeowner may
              see a maid's name, approximate location, skills, experience, rating and starting service fees.
            </p>

            <p className="mt-2 font-medium">3.3 Payments and onboarding</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>To process onboarding and subscription payments via our payment partners.</li>
              <li>To track whether onboarding fees for maids, home nurses and cleaning companies have been paid.</li>
              <li>To prevent duplicate or suspicious payments.</li>
            </ul>

            <p className="mt-2 font-medium">3.4 Safety, verification and compliance</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Verify identities and qualifications using the documents you upload.</li>
              <li>Assess whether profiles meet our platform requirements.</li>
              <li>Investigate and respond to complaints, disputes or suspected abuse.</li>
              <li>Comply with legal obligations and respond to lawful requests from authorities where required.</li>
            </ul>

            <p className="mt-2 font-medium">3.5 Communication</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Send important account, security, payment and verification updates.</li>
              <li>Respond to your enquiries and support tickets.</li>
              <li>Send helpful reminders to complete your profile or verification.</li>
              <li>
                Send optional product updates or promotions where applicable (you can opt out of marketing messages where the
                law allows).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">4. Legal bases for processing</h2>
            <p>
              Depending on your location, we process your personal information based on one or more of the following legal
              grounds: (a) performance of a contract with you; (b) our legitimate interests in operating, improving and
              securing MaidMatch; (c) your consent (for example, to use precise location or send certain marketing
              communications); and (d) compliance with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">5. How we share your information</h2>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>
                <span className="font-medium">With other MaidMatch users:</span> homeowners, maids, nurses and companies see
                limited profile and job information that is needed to connect and work together.
              </li>
              <li>
                <span className="font-medium">With service providers:</span> including payment processors, hosting providers,
                analytics, communication tools and verification partners. They are only allowed to use your data to provide
                these services to us.
              </li>
              <li>
                <span className="font-medium">For legal and safety reasons:</span> to comply with laws, regulations, court
                orders or lawful requests, or to protect the rights, property or safety of MaidMatch, our users or the
                public.
              </li>
              <li>
                <span className="font-medium">Business transfers:</span> if MaidMatch is ever involved in a merger, acquisition
                or sale of assets, your information may be transferred as part of that transaction, subject to appropriate
                safeguards.
              </li>
            </ul>
            <p className="mt-2">We do not sell your personal data to third-party advertisers.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">6. Cookies and similar technologies</h2>
            <p>
              We may use cookies and similar technologies to keep you logged in, remember your preferences, measure usage and
              improve the user experience. You can control cookies through your browser settings. Disabling some cookies may
              affect how MaidMatch works.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">7. Data retention</h2>
            <p>
              We keep your personal information only for as long as it is reasonably necessary for the purposes described in
              this Policy, including providing the Service, resolving disputes, enforcing our agreements and meeting legal or
              accounting obligations. When data is no longer needed, we aim to delete or anonymise it. Some logs and backups
              may be kept for a limited period before they are removed.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">8. Your rights and choices</h2>
            <p>
              Depending on your local laws, you may have rights to access, correct, delete or restrict certain personal data
              we hold about you, or to object to some processing. You may also have a right to data portability and to
              withdraw consent where processing is based on consent.
            </p>
            <p className="mt-2">
              To exercise these rights, please contact us using the details below. We may need to verify your identity before
              acting on your request.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">9. Childrens privacy</h2>
            <p>
              MaidMatch is not intended for children under 18. We do not knowingly allow children under 18 to create service
              provider or homeowner accounts. If we learn that we have collected personal data from a child under 18, we will
              take reasonable steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">10. Data security</h2>
            <p>
              We use reasonable technical and organisational measures to protect your information, including HTTPS encryption
              for data in transit and access controls on our systems. However, no system is completely secure, and we cannot
              guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">11. International transfers</h2>
            <p>
              Our servers or some of our service providers may be located outside your country. By using MaidMatch, you
              understand that your information may be transferred to and processed in other countries that may have
              different data-protection laws. Where required, we take steps to put appropriate safeguards in place.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">12. Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date above
              and may notify you by email, in-app message or a notice on the platform. Your continued use of MaidMatch after
              any changes means you accept the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">13. Contact us</h2>
            <p className="space-y-1">
              <span>If you have questions, concerns or requests about this Policy or how we handle your data, contact us:</span>
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Email: support@maidmatchug.org</li>
              <li>Phone / WhatsApp: 0394765935 </li>
              <li>Address: Kampala, Uganda</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
