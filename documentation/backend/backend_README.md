# MaidMatch Backend API

Django REST API backend for the MaidMatch application.

## Project Structure

```
backend/
├── manage.py              # Django management script
├── backend/               # Main project settings
│   ├── settings.py       # Project configuration
│   ├── urls.py           # Main URL routing
│   └── wsgi.py           # WSGI configuration
├── accounts/             # User authentication & profiles
├── maid/                 # Maid-specific features
├── homeowner/            # Homeowner-specific features
├── admin_app/            # Admin management features
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

## Setup Instructions

### 1. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the backend directory with the following variables:
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## Django Apps

### accounts
Handles user authentication and profile management for all user types (Maids, Homeowners, Admins).

### maid
Maid-specific features including:
- Profile management
- Job acceptance
- Availability management

### homeowner
Homeowner-specific features including:
- Job posting
- Maid hiring
- Job management

### admin_app
Admin features including:
- User management
- System monitoring
- Content moderation

## API Documentation

Once the server is running, access the API documentation at:
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`

## Technologies Used

- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database (production)
- **SQLite** - Database (development)
- **django-cors-headers** - CORS handling
- **drf-yasg** - API documentation
