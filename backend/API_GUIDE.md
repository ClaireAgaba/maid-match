# MaidMatch API Guide

## Base URL
```
http://localhost:8000/api/
```

## Authentication
Currently using Session Authentication. After login, the session cookie is automatically handled.

---

## 📚 API Endpoints

### 🔐 Authentication Endpoints

#### 1. Register User
**POST** `/api/accounts/register/`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "homeowner",
  "phone_number": "+254700000000",
  "home_address": "123 Main St, Nairobi",
  "home_type": "apartment",
  "number_of_rooms": 3
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "user_type": "homeowner",
    ...
  }
}
```

#### 2. Login
**POST** `/api/accounts/login/`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "user_type": "homeowner"
  }
}
```

#### 3. Logout
**POST** `/api/accounts/logout/`

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### 4. Get Current User Profile
**GET** `/api/accounts/users/me/`

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "homeowner",
  "phone_number": "+254700000000",
  "is_verified": true
}
```

#### 5. Change Password
**POST** `/api/accounts/users/change_password/`

**Request Body:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password2": "NewPass123!"
}
```

---

### 👩‍🔧 Maid Endpoints

#### 1. List All Maids
**GET** `/api/maid/profiles/`

**Query Parameters:**
- `availability_status=true` - Filter by availability
- `min_rating=4.0` - Minimum rating
- `max_rate=20.00` - Maximum hourly rate
- `skills=cleaning` - Search by skills
- `search=experienced` - Search in username, skills, bio
- `ordering=-rating` - Order by rating (desc)

**Response:**
```json
[
  {
    "id": 1,
    "username": "maid1",
    "email": "maid1@example.com",
    "phone_number": "+254700000001",
    "experience_years": 5,
    "hourly_rate": "15.00",
    "availability_status": true,
    "rating": "4.50",
    "total_jobs_completed": 25
  }
]
```

#### 2. Get Maid Profile Details
**GET** `/api/maid/profiles/{id}/`

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "username": "maid1",
    "email": "maid1@example.com",
    ...
  },
  "bio": "Experienced maid with 5 years of service",
  "experience_years": 5,
  "hourly_rate": "15.00",
  "skills": "Cleaning, Cooking, Laundry",
  "availability_status": true,
  "rating": "4.50",
  "total_jobs_completed": 25,
  "availability": [
    {
      "id": 1,
      "day_of_week": "monday",
      "start_time": "08:00:00",
      "end_time": "17:00:00",
      "is_available": true
    }
  ]
}
```

#### 3. Get My Maid Profile
**GET** `/api/maid/profiles/my_profile/`

#### 4. Update Maid Profile
**PATCH** `/api/maid/profiles/{id}/`

**Request Body:**
```json
{
  "bio": "Updated bio",
  "hourly_rate": "18.00",
  "skills": "Cleaning, Cooking, Laundry, Ironing",
  "availability_status": true
}
```

#### 5. Get Available Maids
**GET** `/api/maid/profiles/available/`

#### 6. Manage Availability
**GET** `/api/maid/availability/` - List availability
**POST** `/api/maid/availability/` - Create availability
**PATCH** `/api/maid/availability/{id}/` - Update availability
**DELETE** `/api/maid/availability/{id}/` - Delete availability

**Create Availability Request:**
```json
{
  "day_of_week": "monday",
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "is_available": true
}
```

---

### 🏠 Homeowner Endpoints

#### 1. Get My Homeowner Profile
**GET** `/api/homeowner/profiles/my_profile/`

#### 2. Update Homeowner Profile
**PATCH** `/api/homeowner/profiles/{id}/`

**Request Body:**
```json
{
  "home_address": "456 New Street, Nairobi",
  "home_type": "house",
  "number_of_rooms": 5,
  "preferred_maid_gender": "female"
}
```

---

### 💼 Job Endpoints

#### 1. List Jobs
**GET** `/api/homeowner/jobs/`

**Query Parameters:**
- `status=open` - Filter by status
- `job_date=2025-01-20` - Filter by date
- `search=cleaning` - Search in title, description, location
- `ordering=-created_at` - Order by creation date

**Response:**
```json
[
  {
    "id": 1,
    "homeowner_name": "john_doe",
    "title": "House Cleaning",
    "location": "Nairobi, Westlands",
    "job_date": "2025-01-20",
    "start_time": "09:00:00",
    "end_time": "15:00:00",
    "hourly_rate": "20.00",
    "status": "open",
    "applications_count": 3,
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

#### 2. Create Job
**POST** `/api/homeowner/jobs/`

**Request Body:**
```json
{
  "title": "House Cleaning",
  "description": "Need thorough cleaning of 3-bedroom apartment",
  "location": "Nairobi, Westlands",
  "job_date": "2025-01-20",
  "start_time": "09:00:00",
  "end_time": "15:00:00",
  "hourly_rate": "20.00"
}
```

#### 3. Get Job Details
**GET** `/api/homeowner/jobs/{id}/`

#### 4. Update Job
**PATCH** `/api/homeowner/jobs/{id}/`

#### 5. Delete Job
**DELETE** `/api/homeowner/jobs/{id}/`

#### 6. Assign Maid to Job
**POST** `/api/homeowner/jobs/{id}/assign_maid/`

**Request Body:**
```json
{
  "maid_id": 1
}
```

#### 7. Update Job Status
**POST** `/api/homeowner/jobs/{id}/update_status/`

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Status Options:** `open`, `assigned`, `in_progress`, `completed`, `cancelled`

---

### 📝 Job Application Endpoints

#### 1. List Applications
**GET** `/api/homeowner/applications/`

- Maids see their own applications
- Homeowners see applications for their jobs

**Query Parameters:**
- `status=pending` - Filter by status

#### 2. Apply to Job
**POST** `/api/homeowner/applications/`

**Request Body:**
```json
{
  "job": 1,
  "cover_letter": "I am interested in this position...",
  "proposed_rate": "18.00"
}
```

#### 3. Accept Application
**POST** `/api/homeowner/applications/{id}/accept/`

**Response:**
```json
{
  "message": "Application accepted successfully",
  "application": {...}
}
```

#### 4. Reject Application
**POST** `/api/homeowner/applications/{id}/reject/`

---

### ⭐ Review Endpoints

#### 1. List Reviews
**GET** `/api/homeowner/reviews/`

**Query Parameters:**
- `rating=5` - Filter by rating

#### 2. Create Review
**POST** `/api/homeowner/reviews/`

**Request Body:**
```json
{
  "job": 1,
  "reviewee": 2,
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough."
}
```

**Rating:** 1-5 stars

#### 3. Get Review Details
**GET** `/api/homeowner/reviews/{id}/`

---

## 🧪 Testing with cURL

### Register a Homeowner
```bash
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_homeowner",
    "email": "homeowner@test.com",
    "password": "Test123!",
    "password2": "Test123!",
    "first_name": "Test",
    "last_name": "Homeowner",
    "user_type": "homeowner",
    "phone_number": "+254700000000",
    "home_address": "Test Address",
    "home_type": "apartment",
    "number_of_rooms": 3
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/accounts/login/ \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "test_homeowner",
    "password": "Test123!"
  }'
```

### List Maids (Authenticated)
```bash
curl -X GET http://localhost:8000/api/maid/profiles/ \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Create a Job (Authenticated)
```bash
curl -X POST http://localhost:8000/api/homeowner/jobs/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "House Cleaning",
    "description": "Need cleaning service",
    "location": "Nairobi",
    "job_date": "2025-01-20",
    "start_time": "09:00:00",
    "end_time": "15:00:00",
    "hourly_rate": "20.00"
  }'
```

---

## 📖 API Documentation

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

---

## 🔒 Permissions

- **Public**: Registration, Login
- **Authenticated**: All other endpoints
- **Owner Only**: Update/Delete own profile, jobs, applications
- **Homeowner Only**: Create jobs, accept/reject applications
- **Maid Only**: Apply to jobs, manage availability

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

---

## 💡 Tips

1. Use Swagger UI for interactive API testing
2. Session cookies are automatically handled by the browser
3. For mobile apps, consider implementing JWT authentication
4. All timestamps are in ISO 8601 format
5. Pagination is enabled (10 items per page by default)
6. Use query parameters for filtering and searching
