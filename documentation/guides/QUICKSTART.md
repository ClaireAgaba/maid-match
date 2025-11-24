# MaidMatch Backend - Quick Start Guide

## ✅ Setup Complete!

Your Django backend is now fully configured with:
- ✅ Django 4.2.7 with REST Framework
- ✅ Custom User model with role-based authentication
- ✅ Three Django apps: `accounts`, `maid`, `homeowner`, `admin_app`
- ✅ Database models and migrations
- ✅ Admin panel configured
- ✅ API documentation (Swagger/ReDoc)
- ✅ CORS configured for web and mobile apps

## 🚀 Running the Server

### Start Development Server
```bash
cd /home/claire/Desktop/projects/maidmatchapp/backend
source venv/bin/activate
python manage.py runserver
```

The server will be available at: **http://localhost:8000/**

## 🔑 Test Credentials

Three test users have been created for you:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| **Admin** | admin | admin123 | admin@maidmatch.com |
| **Maid** | maid1 | maid123 | maid1@maidmatch.com |
| **Homeowner** | homeowner1 | home123 | homeowner1@maidmatch.com |

## 📊 Admin Panel

Access the Django admin panel at: **http://localhost:8000/admin/**

Login with: `admin` / `admin123`

You can manage:
- Users (all types)
- Maid Profiles & Availability
- Homeowner Profiles
- Jobs & Job Applications
- Reviews

## 📚 API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

## 📁 Project Structure

```
backend/
├── manage.py                    # Django management script
├── backend/                     # Main project settings
│   ├── settings.py             # Configuration
│   ├── urls.py                 # URL routing
│   └── wsgi.py                 # WSGI config
├── accounts/                    # User authentication & profiles
│   ├── models.py               # Custom User model
│   ├── admin.py                # Admin configuration
│   └── management/
│       └── commands/
│           └── create_test_users.py
├── maid/                        # Maid-specific features
│   ├── models.py               # MaidProfile, MaidAvailability
│   └── admin.py
├── homeowner/                   # Homeowner-specific features
│   ├── models.py               # HomeownerProfile, Job, JobApplication, Review
│   └── admin.py
├── admin_app/                   # Admin management features
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
└── venv/                        # Virtual environment
```

## 🗄️ Database Models

### User Model (accounts.User)
- Custom user model extending AbstractUser
- Fields: `user_type`, `phone_number`, `profile_picture`, `address`, `is_verified`
- User types: `homeowner`, `maid`, `admin`

### Maid Models
- **MaidProfile**: Extended profile with bio, experience, hourly rate, skills, rating
- **MaidAvailability**: Weekly schedule for maid availability

### Homeowner Models
- **HomeownerProfile**: Extended profile with home details
- **Job**: Job postings with status tracking
- **JobApplication**: Maids apply to jobs
- **Review**: Rating and review system

## 🛠️ Useful Commands

### Create a new superuser
```bash
python manage.py createsuperuser
```

### Create test users (already done)
```bash
python manage.py create_test_users
```

### Make migrations after model changes
```bash
python manage.py makemigrations
python manage.py migrate
```

### Run tests
```bash
python manage.py test
```

### Collect static files (for production)
```bash
python manage.py collectstatic
```

## 🔄 Next Steps

1. **Start the server**: `python manage.py runserver`
2. **Test the admin panel**: Login at http://localhost:8000/admin/
3. **Create API endpoints**: Add views and serializers for each app
4. **Add authentication**: Implement JWT or token-based auth
5. **Connect frontend**: Configure web and mobile apps to use the API

## 🌐 CORS Configuration

The backend is configured to accept requests from:
- http://localhost:3000 (React web app)
- http://localhost:19006 (Expo web)
- http://localhost:19000 (Expo dev server)

In development, all origins are allowed. Update `settings.py` for production.

## 📝 Environment Variables

Edit `.env` file to configure:
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: Comma-separated hosts
- Database settings (currently using SQLite)

## 🔐 Security Notes

⚠️ **Important for Production:**
1. Change `SECRET_KEY` in `.env`
2. Set `DEBUG=False`
3. Configure proper `ALLOWED_HOSTS`
4. Use PostgreSQL instead of SQLite
5. Set up proper CORS origins
6. Enable HTTPS
7. Configure proper authentication (JWT)

## 📞 Support

For issues or questions, refer to:
- Django docs: https://docs.djangoproject.com/
- DRF docs: https://www.django-rest-framework.org/
- Project README: `README.md`
