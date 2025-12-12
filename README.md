# 🏠 MaidMatch

A comprehensive multi-platform application connecting homeowners with professional domestic workers (maids, home nurses, and cleaning companies) in Uganda.

## 🎯 Overview

MaidMatch is a full-stack platform available on **Web, Android, and iOS** that facilitates connections between homeowners seeking domestic help and professional service providers. The platform includes role-based access control, integrated payments via Pesapal Mobile Money, and comprehensive admin management tools.

## 🚀 Live Platforms

- **Web App:** [https://maidmatch.netlify.app](https://maidmatch.netlify.app)
- **Backend API:** [https://maidmatch.pythonanywhere.com](https://maidmatch.pythonanywhere.com)
- **Android App:** Available on Google Play Store
- **iOS App:** Submitted to App Store (under review)
- **Admin Panel:** Integrated in web dashboard

## ✨ Features

### For Maids
- ✅ Profile creation with personal and professional information
- ✅ Document upload (ID, certificates) with viewing capability
- ✅ Location detection and mapping
- ✅ Availability status toggle
- ✅ Profile verification system
- ✅ Job browsing and applications
- ✅ **Onboarding payment (UGX 5,000)** via Pesapal Mobile Money
- ✅ Dashboard notifications for verification and payment status

### For Home Nurses
- ✅ Complete professional profile with specializations
- ✅ Document upload and verification
- ✅ **Premium onboarding fee (UGX 10,000)** via Pesapal
- ✅ Job browsing (gated until payment)
- ✅ Availability management
- ✅ Verification badge system

### For Cleaning Companies
- ✅ Company profile with business details
- ✅ Business document upload (registration/ID)
- ✅ **Subscription plans:**
  - Monthly (UGX 50,000)
  - Annual (UGX 500,000)
- ✅ Job posting and worker management
- ✅ Verification system

### For Homeowners
- ✅ Profile management with home details
- ✅ Document upload (ID, LC letter)
- ✅ Location detection
- ✅ Job posting
- ✅ Maid/nurse search and filtering
- ✅ **Flexible payment plans:**
  - 24-hour access pass (UGX 5,000)
  - Monthly subscription (UGX 20,000)
  - Live-in placement credit (UGX 100,000)
- ✅ Hire and review service providers

### For Admins
- ✅ **Comprehensive user management:**
  - Manage Maids
  - Manage Homeowners
  - Manage Home Nurses
  - Manage Cleaning Companies
- ✅ Account verification system with notes
- ✅ Enable/disable accounts
- ✅ User search and filtering
- ✅ **Payment transaction monitoring**
- ✅ View user documents
- ✅ Manual payment effect application
- ✅ Platform analytics and statistics

## 🛠️ Tech Stack

### Backend
- **Framework:** Django 4.2+
- **API:** Django REST Framework
- **Database:** SQLite (development) / MySQL (production - PythonAnywhere)
- **Authentication:** JWT + Session-based authentication
- **File Storage:** Django FileField (media files)
- **Payment Integration:** Pesapal Mobile Money API
- **Deployment:** PythonAnywhere

### Frontend (Web)
- **Framework:** React 18+
- **Build Tool:** Vite
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Deployment:** Netlify

### Mobile (iOS & Android)
- **Framework:** Capacitor 6
- **Base:** React web app (shared codebase)
- **Native Features:** 
  - Persistent authentication (localStorage)
  - Native app shell
  - Platform-specific optimizations
- **iOS Build:** Xcode
- **Android Build:** Android Studio / Gradle

## 📁 Project Structure

```
maidmatchapp/
├── backend/
│   ├── accounts/          # User authentication & management
│   ├── maid/             # Maid profiles & features
│   ├── homeowner/        # Homeowner profiles & jobs
│   ├── home_nursing/     # Home nurse profiles & features
│   ├── cleaning_company/ # Cleaning company profiles
│   ├── payments/         # Pesapal payment integration
│   ├── admin_app/        # Admin-specific features
│   ├── backend/          # Django project settings
│   ├── media/            # Uploaded files (documents, photos)
│   ├── manage.py
│   └── requirements.txt
│
├── web/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── context/      # React Context (Auth)
│   │   ├── pages/        # Page components
│   │   │   ├── company/  # Company-specific pages
│   │   │   └── ...       # Other pages
│   │   ├── services/     # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── mobile/
│   ├── android/          # Android native project
│   ├── ios/              # iOS native project (Xcode)
│   ├── capacitor.config.json
│   └── package.json
│
├── documentation/        # Project documentation
│   ├── admin/           # Admin feature docs
│   ├── backend/         # Backend API docs
│   ├── guides/          # Feature implementation guides
│   └── web/             # Frontend docs
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to web directory:**
   ```bash
   cd web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

## 🔑 User Types & Access

### Maid
- Register with phone number (primary identifier)
- Complete profile with documents (ID, certificates)
- **Pay onboarding fee (UGX 5,000)** via Mobile Money
- Toggle availability status
- Browse and apply for jobs
- Requires admin verification + payment to access jobs
- Dashboard notifications for pending actions

### Home Nurse
- Register with professional credentials
- Upload verification documents
- **Pay premium onboarding (UGX 10,000)** via Mobile Money
- Browse nursing jobs (gated until payment)
- Manage availability and specializations
- Requires verification for job access

### Cleaning Company
- Register company with business details
- Upload business registration/ID documents
- **Subscribe to access platform:**
  - Monthly: UGX 50,000
  - Annual: UGX 500,000
- Post jobs and manage workers
- Requires verification

### Homeowner
- Register with phone number
- Add home details and documents (ID, LC letter)
- **Choose payment plan:**
  - 24h pass: UGX 5,000
  - Monthly: UGX 20,000
  - Live-in credit: UGX 100,000
- Post jobs and search service providers
- Hire and review workers
- Payment required to access maid/nurse profiles

### Admin
- Access via superuser credentials
- **Manage all user types** (maids, nurses, companies, homeowners)
- Verify accounts with notes
- Enable/disable accounts
- **Monitor payment transactions**
- Apply payment effects manually
- View all uploaded documents
- Platform statistics and analytics

## 📱 Key Features Implemented

### Authentication & Authorization
- Phone number as primary identifier
- Email optional
- JWT + Session-based authentication
- Role-based access control (5 user types)
- **Platform-specific auth:**
  - Web: sessionStorage (logout on close)
  - Mobile: localStorage (persistent login)

### Payment Integration (Pesapal Mobile Money)
- **Onboarding fees:**
  - Maids: UGX 5,000
  - Home Nurses: UGX 10,000
- **Subscriptions:**
  - Homeowner 24h pass: UGX 5,000
  - Homeowner monthly: UGX 20,000
  - Homeowner live-in: UGX 100,000
  - Company monthly: UGX 50,000
  - Company annual: UGX 500,000
- IPN webhook for automatic status updates
- Payment callback with user-friendly redirect
- Admin transaction monitoring
- Manual payment effect application

### Profile Management
- **Maids:** Personal info, professional details, documents (ID, certificate), availability
- **Home Nurses:** Professional credentials, specializations, documents
- **Cleaning Companies:** Business details, registration documents
- **Homeowners:** Personal info, home details, documents (ID, LC letter)
- Profile photo upload
- Location detection via GPS
- Document viewing for users and admins

### Verification System
- Admin can verify all account types
- Verified badge display across platform
- Verification notes for admin records
- **Access gating:**
  - Maids: verification + payment required
  - Nurses: verification + payment required
  - Companies: verification + subscription required
  - Homeowners: payment required

### Dashboard Features
- **Maid Dashboard:** Profile card, verification status, availability toggle, payment card, notifications
- **Nurse Dashboard:** Profile card, premium onboarding card, job browsing gate, notifications
- **Company Dashboard:** Profile card, subscription status, worker management
- **Homeowner Dashboard:** Profile card, home info, payment plans, quick actions
- **Admin Dashboard:** 
  - Manage Maids (with documents)
  - Manage Homeowners (with payment plan display)
  - Manage Home Nurses
  - Manage Cleaning Companies
  - Payment transaction list with user display
  - Bulk actions for payment effects

### Notifications System
- Dashboard bell icon with count badge
- Role-specific notifications:
  - Maids: verification pending, payment pending
  - Nurses: verification pending, payment pending
  - Companies: subscription expiring/expired
  - Homeowners: subscription expiring/expired
- Actionable notification items (click to open modal/page)

## 🔐 Security Features

- CSRF protection
- Session-based authentication
- Role-based access control
- Admin-only endpoints
- File upload validation

## 📊 Database Models

### User (Custom)
- username, email (optional), phone_number (unique)
- full_name, gender
- user_type (maid/homeowner/admin/home_nurse/cleaning_company)
- profile_picture, address

### MaidProfile
- Personal: full_name, date_of_birth, location, contact
- Professional: experience, hourly_rate, skills, availability
- Status: is_verified, is_enabled
- Payment: onboarding_fee_paid, onboarding_fee_paid_at
- Documents: id_document, certificate

### HomeNurse
- Personal: full_name, date_of_birth, contact
- Professional: specialization, experience, hourly_rate
- Status: is_verified, is_enabled
- Payment: onboarding_fee_paid, onboarding_fee_paid_at
- Documents: id_document, certificate, license

### CleaningCompany
- Business: company_name, registration_number, contact
- Subscription: has_active_subscription, subscription_type, subscription_expires_at
- Status: is_verified, is_enabled
- Documents: id_document (business registration)

### HomeownerProfile
- Home: home_address, home_type, number_of_rooms
- Payment: subscription_type, subscription_expires_at, has_live_in_credit
- Documents: id_document, lc_letter

### MobileMoneyTransaction
- Purpose: maid_onboarding, nurse_onboarding, homeowner_subscription, company_subscription, etc.
- Foreign Keys: maid, home_nurse, homeowner, company
- Payment: amount, network, phone_number, status
- Pesapal: provider_reference, merchant_reference, raw_callback
- Timestamps: created_at, completed_at

### Job
- title, description, location
- job_date, start_time, end_time
- hourly_rate, status
- assigned_maid, posted_by (homeowner)

## 🎨 UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Modern, clean interface
- Color-coded status indicators
- Real-time search and filtering
- Modal dialogs for details
- Toast notifications
- Loading states

## 🔄 API Endpoints

### Authentication
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `POST /api/accounts/logout/` - User logout
- `GET /api/accounts/users/me/` - Get current user
- `PATCH /api/accounts/users/me/` - Update current user

### Maid
- `GET /api/maid/profiles/` - List all maids
- `GET /api/maid/profiles/me/` - Get my profile
- `PATCH /api/maid/profiles/me/` - Update my profile
- `POST /api/maid/profiles/{id}/verify/` - Verify maid (admin)
- `POST /api/maid/profiles/{id}/disable/` - Disable maid (admin)

### Homeowner
- `GET /api/homeowner/profiles/` - List all homeowners
- `GET /api/homeowner/profiles/my_profile/` - Get my profile
- `PATCH /api/homeowner/profiles/{id}/` - Update profile

## 🌍 Deployment

### Backend (Django) - PythonAnywhere
- **URL:** https://maidmatch.pythonanywhere.com
- **Database:** MySQL (PythonAnywhere managed)
- **Environment variables:**
  - `DEBUG=False`
  - `SECRET_KEY` (Django secret)
  - `PESAPAL_CONSUMER_KEY` (payment API)
  - `PESAPAL_CONSUMER_SECRET` (payment API)
  - `FRONTEND_URL` (for payment redirects)
- **Static/Media files:** Served via Django
- **HTTPS:** Enabled by default

### Frontend (React) - Netlify
- **URL:** https://maidmatch.netlify.app
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variables:**
  - `VITE_API_URL=https://maidmatch.pythonanywhere.com`
- **Auto-deploy:** On git push to main branch
- **Redirects:** Configured for SPA routing

### Mobile Apps

#### Android
- **Build:** Android Studio / Gradle
- **Distribution:** Google Play Store
- **Version management:** `versionCode` in `build.gradle`
- **Build process:**
  ```bash
  cd mobile
  npm run build  # Build web assets
  npx cap sync android
  # Open in Android Studio and build signed APK/AAB
  ```

#### iOS
- **Build:** Xcode on macOS
- **Distribution:** Apple App Store
- **Version management:** Version & Build number in Xcode
- **Build process:**
  ```bash
  cd mobile
  npm run build  # Build web assets
  npx cap sync ios
  npx cap open ios  # Open in Xcode
  # Archive and upload via Xcode
  ```

## 📝 Environment Variables

### Backend (.env)
```bash
DEBUG=False
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=maidmatch.pythonanywhere.com

# Pesapal Payment Integration
PESAPAL_CONSUMER_KEY=your-pesapal-key
PESAPAL_CONSUMER_SECRET=your-pesapal-secret
PESAPAL_CALLBACK_URL=https://maidmatch.pythonanywhere.com/pesapal/payment-complete/
FRONTEND_URL=https://maidmatch.netlify.app

# Database (auto-configured on PythonAnywhere)
DATABASE_URL=mysql://...
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://maidmatch.pythonanywhere.com
```

### Mobile (capacitor.config.json)
```json
{
  "appId": "com.maidmatch.app",
  "appName": "MaidMatch",
  "webDir": "dist",
  "server": {
    "url": "https://maidmatch.netlify.app",
    "cleartext": true
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Claire Agaba** - Initial work

## 🙏 Acknowledgments

- Django REST Framework
- React + Vite
- Tailwind CSS
- Lucide Icons
- OpenStreetMap (for location services)

## 💳 Payment System

MaidMatch uses **Pesapal Mobile Money** integration for all payments:

### Payment Flow
1. User initiates payment from dashboard
2. Backend creates transaction record and calls Pesapal API
3. User redirected to Pesapal payment page
4. User completes payment via Mobile Money (MTN, Airtel)
5. Pesapal sends IPN (Instant Payment Notification) to backend webhook
6. Backend updates user subscription/onboarding status
7. User redirected back to dashboard with success message

### Supported Networks
- MTN Mobile Money
- Airtel Money

### Admin Features
- View all transactions with user details
- Monitor payment status
- Manually apply payment effects for failed IPNs
- Bulk actions for transaction processing

## 📞 Support

- **Email:** support@maidmatchug.org
- **Phone:** +256 394 765 935
- **Address:** Kampala, Uganda
- **GitHub Issues:** For bug reports and feature requests

## 📚 Documentation

Comprehensive documentation available in the `/documentation` folder:
- **Admin Guides:** User management, verification, payment monitoring
- **Backend API:** Endpoint documentation and examples
- **Feature Guides:** Implementation details for all features
- **Web Frontend:** Component structure and state management

## 🎯 Roadmap

### Completed ✅
- Multi-platform deployment (Web, Android, iOS)
- Payment integration (Pesapal Mobile Money)
- All user types (Maids, Nurses, Companies, Homeowners, Admin)
- Document management system
- Verification system
- Subscription management
- Privacy policy and legal pages

### Upcoming 🚀
- In-app messaging between users
- Push notifications (mobile)
- Advanced job matching algorithm
- Rating and review system enhancements
- Analytics dashboard for admins
- Multi-language support (English, Luganda)

---

**Built with ❤️ in Uganda**
