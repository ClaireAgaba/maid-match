# Maid Profile - Biodata Fields Update

## ✅ Updated Maid Profile Model

The MaidProfile model has been updated to include comprehensive biodata fields as requested.

---

## 📋 New Fields Added

### Bio Data & General Info

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **full_name** | CharField | Optional | Full name of the maid |
| **date_of_birth** | DateField | Optional | Date of birth (YYYY-MM-DD) |
| **profile_photo** | ImageField | Optional | Profile photo upload |
| **location** | CharField | Optional | Current location (auto-detected or manual) |
| **latitude** | DecimalField | Optional | GPS latitude coordinate |
| **longitude** | DecimalField | Optional | GPS longitude coordinate |
| **phone_number** | CharField | Optional | Phone number |
| **email** | EmailField | Optional | Email address (optional) |

### Computed Fields
| Field | Type | Description |
|-------|------|-------------|
| **age** | Integer | Automatically calculated from date_of_birth |

---

## 🔄 Updated API Endpoints

### 1. Register Maid (POST `/api/accounts/register/`)

**Request Body:**
```json
{
  "username": "maid_jane",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Doe",
  "user_type": "maid",
  
  // New Maid Biodata Fields
  "full_name": "Jane Mary Doe",
  "date_of_birth": "1995-05-15",
  "location": "Nairobi, Westlands",
  "latitude": "-1.2921",
  "longitude": "36.8219",
  "phone_number": "+254712345678",
  "email": "jane.doe@example.com"
}
```

### 2. Get Maid Profile (GET `/api/maid/profiles/{id}/`)

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 2,
    "username": "maid_jane",
    "email": "jane@example.com",
    "user_type": "maid"
  },
  
  // Bio Data & General Info
  "full_name": "Jane Mary Doe",
  "date_of_birth": "1995-05-15",
  "age": 29,
  "profile_photo": "/media/maid_profiles/photos/jane.jpg",
  "location": "Nairobi, Westlands",
  "latitude": "-1.2921",
  "longitude": "36.8219",
  "phone_number": "+254712345678",
  "email": "jane.doe@example.com",
  
  // Professional Info
  "bio": "Experienced maid with 5 years of service",
  "experience_years": 5,
  "hourly_rate": "15.00",
  "skills": "Cleaning, Cooking, Laundry",
  "availability_status": true,
  "rating": "4.50",
  "total_jobs_completed": 25,
  
  // Documents
  "id_document": "/media/maid_documents/ids/jane_id.pdf",
  "certificate": "/media/maid_documents/certificates/jane_cert.pdf",
  
  // Availability
  "availability": [
    {
      "id": 1,
      "day_of_week": "monday",
      "start_time": "08:00:00",
      "end_time": "17:00:00",
      "is_available": true
    }
  ],
  
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### 3. Update Maid Profile (PATCH `/api/maid/profiles/{id}/`)

**Request Body:**
```json
{
  // Bio Data & General Info
  "full_name": "Jane Mary Doe",
  "date_of_birth": "1995-05-15",
  "profile_photo": "<file upload>",
  "location": "Nairobi, Kilimani",
  "latitude": "-1.2921",
  "longitude": "36.8219",
  "phone_number": "+254712345678",
  "email": "jane.updated@example.com",
  
  // Professional Info
  "bio": "Updated bio",
  "experience_years": 6,
  "hourly_rate": "18.00",
  "skills": "Cleaning, Cooking, Laundry, Ironing",
  "availability_status": true,
  
  // Documents
  "id_document": "<file upload>",
  "certificate": "<file upload>"
}
```

### 4. List Maids (GET `/api/maid/profiles/`)

**Query Parameters:**
- `location=Nairobi` - Filter by location
- `min_rating=4.0` - Minimum rating
- `max_rate=20.00` - Maximum hourly rate
- `skills=cleaning` - Search by skills
- `search=Jane` - Search in full_name, location, phone, email, skills, bio
- `ordering=-rating` - Order by rating (desc)

**Response:**
```json
[
  {
    "id": 1,
    "username": "maid_jane",
    "full_name": "Jane Mary Doe",
    "age": 29,
    "profile_photo": "/media/maid_profiles/photos/jane.jpg",
    "location": "Nairobi, Westlands",
    "phone_number": "+254712345678",
    "email": "jane.doe@example.com",
    "experience_years": 5,
    "hourly_rate": "15.00",
    "availability_status": true,
    "rating": "4.50",
    "total_jobs_completed": 25
  }
]
```

---

## 🔍 Search & Filter Capabilities

### Search Fields
The following fields are now searchable:
- `full_name` - Full name
- `location` - Location
- `phone_number` - Phone number
- `email` - Email address
- `user__username` - Username
- `skills` - Skills
- `bio` - Biography

### Filter Fields
- `availability_status` - Available/Not available
- `experience_years` - Years of experience
- `location` - Location (contains)
- `min_rating` - Minimum rating
- `max_rate` - Maximum hourly rate
- `skills` - Skills (contains)

### Ordering Fields
- `rating` - Rating
- `hourly_rate` - Hourly rate
- `experience_years` - Experience years
- `total_jobs_completed` - Jobs completed
- `date_of_birth` - Date of birth (age)

---

## 📱 Mobile App Integration

### Location Detection
The mobile app should:
1. Request location permissions
2. Get current GPS coordinates (latitude, longitude)
3. Reverse geocode to get readable address
4. Send both coordinates and address to API

**Example (React Native with Expo):**
```javascript
import * as Location from 'expo-location';

async function getCurrentLocation() {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  let location = await Location.getCurrentPositionAsync({});
  let address = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    location: `${address[0].city}, ${address[0].district}`
  };
}
```

### Profile Photo Upload
```javascript
import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    // Upload to API
    const formData = new FormData();
    formData.append('profile_photo', {
      uri: result.assets[0].uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    
    // Send to API
    await fetch('http://localhost:8000/api/maid/profiles/1/', {
      method: 'PATCH',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}
```

---

## 🎯 Admin Panel Updates

The admin panel now displays:

### List View
- Full Name
- Phone Number
- Location
- Experience Years
- Hourly Rate
- Availability Status
- Rating

### Detail View (Organized in Sections)
1. **Bio Data & General Info**
   - User, Full Name, Date of Birth, Profile Photo, Phone, Email

2. **Location**
   - Location, Latitude, Longitude

3. **Professional Info**
   - Bio, Experience, Hourly Rate, Skills, Availability

4. **Performance**
   - Rating, Total Jobs Completed

5. **Documents**
   - ID Document, Certificate

6. **Timestamps**
   - Created At, Updated At

---

## 🧪 Testing

### Test Maid Registration
```bash
curl -X POST http://localhost:8000/api/accounts/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_maid",
    "email": "test@maid.com",
    "password": "Test123!",
    "password2": "Test123!",
    "first_name": "Test",
    "last_name": "Maid",
    "user_type": "maid",
    "full_name": "Test Maid Full Name",
    "date_of_birth": "1995-05-15",
    "location": "Nairobi, Westlands",
    "latitude": "-1.2921",
    "longitude": "36.8219",
    "phone_number": "+254712345678",
    "email": "test.maid@example.com"
  }'
```

### Test Location-Based Search
```bash
curl -X GET "http://localhost:8000/api/maid/profiles/?location=Nairobi" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Test Full Name Search
```bash
curl -X GET "http://localhost:8000/api/maid/profiles/?search=Jane" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## ✅ Migration Status

**Migration:** `maid/migrations/0002_maidprofile_date_of_birth_maidprofile_email_and_more.py`

**Status:** ✅ Applied successfully

**Fields Added:**
- date_of_birth
- email
- full_name
- latitude
- location
- longitude
- phone_number
- profile_photo

---

## 📝 Notes

1. **All new fields are optional** to maintain backward compatibility with existing records
2. **Age is automatically calculated** from date_of_birth
3. **Location can be auto-detected** using GPS or manually entered
4. **Profile photo supports image uploads** (JPEG, PNG)
5. **Email is optional** as specified in requirements
6. **Phone number format** should include country code (e.g., +254...)

---

## 🚀 Next Steps

1. ✅ Model updated with biodata fields
2. ✅ Migrations created and applied
3. ✅ Serializers updated
4. ✅ Views updated with location filtering
5. ✅ Admin panel configured
6. 🔄 Test the API endpoints
7. 🔄 Update mobile app to use new fields
8. 🔄 Implement location detection in mobile app
9. 🔄 Implement photo upload in mobile app

---

**Status:** ✅ **Backend Updated and Ready**

The maid profile now includes all requested biodata fields and is ready for mobile app integration!
