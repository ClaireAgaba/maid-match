# ✅ Registration Form Updated!

## 🎯 **What's Been Updated**

The registration form now collects **role-specific information** based on whether the user is registering as a **Homeowner** or **Maid**.

---

## 📋 **Form Fields**

### **Common Fields** (All Users)
- ✅ First Name
- ✅ Last Name
- ✅ Username
- ✅ Email
- ✅ Phone Number
- ✅ Password
- ✅ Confirm Password
- ✅ User Type (Homeowner/Maid)

### **Maid-Specific Fields** (Required)
When user selects "Maid", these additional fields appear:
- ✅ **Full Name** - Complete name for profile
- ✅ **Date of Birth** - For age calculation
- ✅ **Location** - Current location (e.g., "Nairobi, Westlands")

### **Homeowner-Specific Fields** (Optional)
When user selects "Homeowner", these additional fields appear:
- ✅ **Home Address** - Full address
- ✅ **Home Type** - Dropdown (Apartment, House, Villa, Condo, Other)
- ✅ **Number of Rooms** - Number input

---

## 🔄 **How It Works**

### **1. User Selects Type**
```
[🏠 Homeowner] or [👩‍🔧 Maid]
```

### **2. Form Adapts**
- Form dynamically shows/hides fields based on selection
- Required fields are validated before submission

### **3. Data Sent to Backend**
```javascript
// Maid Registration
{
  username: "jane_maid",
  email: "jane@example.com",
  password: "SecurePass123!",
  password2: "SecurePass123!",
  first_name: "Jane",
  last_name: "Doe",
  user_type: "maid",
  phone_number: "+254712345678",
  
  // Maid-specific
  full_name: "Jane Mary Doe",
  date_of_birth: "1995-05-15",
  location: "Nairobi, Westlands"
}
```

```javascript
// Homeowner Registration
{
  username: "john_home",
  email: "john@example.com",
  password: "SecurePass123!",
  password2: "SecurePass123!",
  first_name: "John",
  last_name: "Smith",
  user_type: "homeowner",
  phone_number: "+254712345678",
  
  // Homeowner-specific
  home_address: "123 Main Street, Nairobi",
  home_type: "apartment",
  number_of_rooms: 3
}
```

### **4. Backend Creates Profile**
- User account created
- MaidProfile or HomeownerProfile created automatically
- All data stored in database

---

## 🧪 **Testing the Registration**

### **Test Maid Registration**
1. Go to http://localhost:3000/register
2. Click on **"Maid"** card
3. Fill in all fields:
   - First Name: `Jane`
   - Last Name: `Doe`
   - Username: `jane_test`
   - Email: `jane@test.com`
   - Phone: `+254712345678`
   - **Full Name**: `Jane Mary Doe`
   - **Date of Birth**: `1995-05-15`
   - **Location**: `Nairobi, Westlands`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
4. Click **"Create Account"**
5. Should redirect to dashboard ✅

### **Test Homeowner Registration**
1. Go to http://localhost:3000/register
2. Click on **"Homeowner"** card
3. Fill in all fields:
   - First Name: `John`
   - Last Name: `Smith`
   - Username: `john_test`
   - Email: `john@test.com`
   - Phone: `+254712345678`
   - **Home Address**: `123 Main St, Nairobi`
   - **Home Type**: `Apartment`
   - **Number of Rooms**: `3`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
4. Click **"Create Account"**
5. Should redirect to dashboard ✅

---

## ✅ **Validation**

### **Client-Side Validation**
- ✅ Password match check
- ✅ Required fields check
- ✅ Maid-specific required fields validation
- ✅ Real-time error clearing

### **Server-Side Validation**
- ✅ Username uniqueness
- ✅ Email format
- ✅ Password strength
- ✅ Date format validation
- ✅ Field length limits

---

## 📊 **Database Storage**

### **User Table** (`accounts_user`)
```
id | username | email | first_name | last_name | user_type | phone_number
```

### **Maid Profile Table** (`maid_maidprofile`)
```
id | user_id | full_name | date_of_birth | location | phone_number | email
```

### **Homeowner Profile Table** (`homeowner_homeownerprofile`)
```
id | user_id | home_address | home_type | number_of_rooms
```

---

## 🎨 **UI Features**

### **Dynamic Form**
- Fields appear/disappear based on user type selection
- Smooth transitions
- Clear visual feedback

### **Error Handling**
- Field-level error messages
- Form-level error alerts
- Clear error descriptions

### **User Experience**
- Intuitive user type selection
- Clear labels and placeholders
- Helpful example text
- Loading states during submission

---

## 🔧 **Technical Details**

### **Frontend** (`web/src/pages/Register.jsx`)
```javascript
// Conditional rendering
{formData.user_type === 'maid' && (
  <MaidSpecificFields />
)}

{formData.user_type === 'homeowner' && (
  <HomeownerSpecificFields />
)}
```

### **Backend** (`backend/accounts/views.py`)
```python
if user.user_type == 'maid':
    MaidProfile.objects.create(
        user=user,
        full_name=request.data.get('full_name', ''),
        date_of_birth=request.data.get('date_of_birth'),
        location=request.data.get('location', ''),
        # ...
    )
elif user.user_type == 'homeowner':
    HomeownerProfile.objects.create(
        user=user,
        home_address=request.data.get('home_address', ''),
        # ...
    )
```

---

## 📝 **What Happens After Registration**

1. ✅ User account created in database
2. ✅ Profile created (Maid or Homeowner)
3. ✅ User automatically logged in
4. ✅ Session cookie set
5. ✅ Redirected to dashboard
6. ✅ Welcome message displayed

---

## 🚀 **Next Steps**

### **Immediate**
1. ✅ Registration form updated
2. 🔄 Test maid registration
3. 🔄 Test homeowner registration
4. 🔄 Verify data in admin panel

### **Future Enhancements**
- 📍 Add GPS location picker for maids
- 📷 Add profile photo upload during registration
- 📧 Add email verification
- 📱 Add phone number verification
- 🗺️ Add address autocomplete for homeowners
- ✨ Add progress indicator for multi-step form

---

## 🎯 **Status**

| Feature | Status |
|---------|--------|
| **Dynamic Form** | ✅ Complete |
| **Maid Fields** | ✅ Complete |
| **Homeowner Fields** | ✅ Complete |
| **Validation** | ✅ Complete |
| **Backend Integration** | ✅ Complete |
| **Error Handling** | ✅ Complete |
| **Data Storage** | ✅ Complete |

---

## 🔗 **Quick Links**

- **Registration Page:** http://localhost:3000/register
- **Login Page:** http://localhost:3000/login
- **Admin Panel:** http://localhost:8000/admin
- **API Docs:** http://localhost:8000/swagger

---

**Registration Form Status:** ✅ **UPDATED AND READY**

**You can now register maids and homeowners with complete profile information!** 🎉
