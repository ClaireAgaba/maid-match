# 🏠 MaidMatch

A comprehensive platform connecting homeowners with professional maids in Uganda.

## 🎯 Overview

MaidMatch is a full-stack web application that facilitates connections between homeowners seeking domestic help and professional maids looking for employment opportunities. The platform includes role-based access control for homeowners, maids, and administrators.

## ✨ Features

### For Maids
- ✅ Profile creation with personal and professional information
- ✅ Document upload (ID, certificates)
- ✅ Location detection and mapping
- ✅ Availability status toggle
- ✅ Profile verification system
- ✅ Job browsing and applications

### For Homeowners
- ✅ Profile management with home details
- ✅ Document upload (ID, LC letter)
- ✅ Location detection
- ✅ Job posting
- ✅ Maid search and filtering
- ✅ Hire and review maids

### For Admins
- ✅ Separate maid and homeowner management
- ✅ Account verification system
- ✅ Enable/disable accounts
- ✅ User search and filtering
- ✅ Platform analytics

## 🛠️ Tech Stack

### Backend
- **Framework:** Django 4.2+
- **API:** Django REST Framework
- **Database:** SQLite (development) / PostgreSQL (production)
- **Authentication:** Session-based authentication
- **File Storage:** Local storage / AWS S3 (production)

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios

## 📁 Project Structure

```
maidmatchapp/
├── backend/
│   ├── accounts/          # User authentication & management
│   ├── maid/             # Maid profiles & features
│   ├── homeowner/        # Homeowner profiles & jobs
│   ├── maidmatch/        # Django project settings
│   ├── media/            # Uploaded files
│   ├── manage.py
│   └── requirements.txt
│
├── web/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── context/      # React Context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
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
- Complete profile with documents
- Toggle availability status
- Browse and apply for jobs
- Requires admin verification to get jobs

### Homeowner
- Register with phone number
- Add home details and documents
- Post jobs
- Search and hire maids
- Leave reviews

### Admin
- Access via superuser credentials
- Manage maids (verify, enable/disable)
- Manage homeowners
- View platform statistics
- Moderate content

## 📱 Key Features Implemented

### Authentication
- Phone number as primary identifier
- Email optional
- Session-based authentication
- Role-based access control

### Profile Management
- **Maids:** Personal info, professional details, documents, availability
- **Homeowners:** Personal info, home details, documents
- Profile photo upload
- Location detection via GPS

### Verification System
- Admin can verify maid accounts
- Verified badge display
- Only verified + enabled maids can get jobs
- Verification notes for admin records

### Dashboard Features
- **Maid Dashboard:** Profile card, verification status, availability toggle
- **Homeowner Dashboard:** Profile card, home info, quick actions
- **Admin Dashboard:** Separate maid and homeowner management

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
- user_type (maid/homeowner/admin)
- profile_picture, address

### MaidProfile
- Personal: full_name, date_of_birth, location, contact
- Professional: experience, hourly_rate, skills, availability
- Status: is_verified, is_enabled
- Documents: id_document, certificate

### HomeownerProfile
- Home: home_address, home_type, number_of_rooms
- Documents: id_document, lc_letter

### Job
- title, description, location
- job_date, start_time, end_time
- hourly_rate, status
- assigned_maid

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

### Backend (Django)
- Set `DEBUG=False` in production
- Configure PostgreSQL database
- Set up static/media file serving
- Use environment variables for secrets
- Enable HTTPS

### Frontend (React)
- Build production bundle: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Update API base URL
- Enable CORS on backend

## 📝 Environment Variables

### Backend (.env)
```
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=yourdomain.com
```

### Frontend (.env)
```
VITE_API_URL=https://api.yourdomain.com
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

## 📞 Support

For support, email support@maidmatch.com or open an issue in the repository.

---

**Built with ❤️ in Kenya**
