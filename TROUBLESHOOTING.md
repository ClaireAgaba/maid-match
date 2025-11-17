# 🔧 Troubleshooting Guide

## ❌ **Issue: Profile Image Not Showing on Dashboard**

### **Symptoms:**
- Dashboard loads but no profile image appears
- No profile card visible
- Console may show API errors

---

## 🔍 **Diagnostic Steps**

### **1. Check Browser Console**
```
1. Open browser (Chrome/Firefox)
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Look for red error messages
5. Check "Network" tab for failed requests
```

### **2. Check Backend Server**
```bash
# Check if Django is running
ps aux | grep "manage.py runserver"

# Check Django logs
cd /home/claire/Desktop/projects/maidmatchapp/backend
tail -f logs.txt  # if logging to file
```

### **3. Test API Endpoint Directly**
```bash
# Test if endpoint exists
curl -X GET http://localhost:8000/api/maid/profiles/me/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"

# Or use browser:
# Go to: http://localhost:8000/api/maid/profiles/me/
```

---

## ✅ **Common Fixes**

### **Fix 1: Restart Both Servers**
```bash
# Kill Django
pkill -f "manage.py runserver"

# Kill React
pkill -f "vite"

# Start Django
cd /home/claire/Desktop/projects/maidmatchapp/backend
./venv/bin/python manage.py runserver

# Start React
cd /home/claire/Desktop/projects/maidmatchapp/web
npm run dev
```

### **Fix 2: Clear Browser Cache**
```
1. Open browser
2. Press Ctrl+Shift+Delete
3. Clear "Cached images and files"
4. Refresh page (Ctrl+R)
```

### **Fix 3: Check MaidProfile Exists**
```bash
cd /home/claire/Desktop/projects/maidmatchapp/backend
./venv/bin/python manage.py shell

# In Python shell:
from maid.models import MaidProfile
from accounts.models import User

# Check if maid2 has a profile
user = User.objects.get(username='maid2')
print(f"User: {user}")
print(f"User type: {user.user_type}")

try:
    profile = MaidProfile.objects.get(user=user)
    print(f"Profile exists: {profile}")
    print(f"Full name: {profile.full_name}")
    print(f"Photo: {profile.profile_photo}")
    print(f"Available: {profile.availability_status}")
except MaidProfile.DoesNotExist:
    print("ERROR: No MaidProfile found!")
    print("Creating profile...")
    MaidProfile.objects.create(
        user=user,
        full_name="Maid2 Test",
        location="Nairobi",
        phone_number=user.phone_number
    )
    print("Profile created!")
```

### **Fix 4: Check API Response**
```javascript
// Open browser console and run:
fetch('http://localhost:8000/api/maid/profiles/me/', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Profile data:', data))
.catch(err => console.error('Error:', err));
```

---

## 🐛 **Common Errors**

### **Error 1: "Maid profile not found"**
**Cause:** User doesn't have a MaidProfile
**Fix:**
```python
# Create profile in Django shell
from maid.models import MaidProfile
from accounts.models import User

user = User.objects.get(username='maid2')
MaidProfile.objects.create(
    user=user,
    full_name="Maid2 Test",
    location="Nairobi",
    phone_number=user.phone_number,
    availability_status=True
)
```

### **Error 2: "Network Error" / "Failed to fetch"**
**Cause:** Backend not running or CORS issue
**Fix:**
```bash
# Check backend is running
curl http://localhost:8000/api/

# Restart backend
cd backend
./venv/bin/python manage.py runserver
```

### **Error 3: "403 Forbidden"**
**Cause:** CSRF token issue or not authenticated
**Fix:**
```javascript
// Check if logged in
console.log('User:', localStorage.getItem('user'));

// If not logged in, login again
// Go to: http://localhost:3000/login
```

### **Error 4: Profile image URL broken**
**Cause:** Image path incorrect or MEDIA_URL not configured
**Fix:**
```python
# Check Django settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Check urls.py includes media files
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 📊 **Verification Checklist**

- [ ] Django server running on port 8000
- [ ] React server running on port 3000
- [ ] User is logged in (check localStorage)
- [ ] User is a maid (user_type='maid')
- [ ] MaidProfile exists for user
- [ ] API endpoint `/api/maid/profiles/me/` returns data
- [ ] No console errors in browser
- [ ] CORS configured correctly
- [ ] CSRF token working

---

## 🔧 **Quick Test Script**

Save as `test_profile.py` and run:
```python
import requests

# Test API
session = requests.Session()

# Login first
login_data = {
    'username': 'maid2',
    'password': 'your_password'
}
r = session.post('http://localhost:8000/api/accounts/login/', json=login_data)
print(f"Login: {r.status_code}")

# Get profile
r = session.get('http://localhost:8000/api/maid/profiles/me/')
print(f"Profile: {r.status_code}")
print(f"Data: {r.json()}")
```

---

## 🚀 **Fresh Start (Nuclear Option)**

If nothing works, start fresh:
```bash
# 1. Stop everything
pkill -f "manage.py runserver"
pkill -f "vite"

# 2. Clear browser data
# - Open browser
# - Ctrl+Shift+Delete
# - Clear everything
# - Close browser

# 3. Restart backend
cd /home/claire/Desktop/projects/maidmatchapp/backend
./venv/bin/python manage.py runserver

# 4. Restart frontend
cd /home/claire/Desktop/projects/maidmatchapp/web
rm -rf node_modules/.vite
npm run dev

# 5. Open fresh browser window
# - Go to: http://localhost:3000
# - Login as maid2
# - Check dashboard
```

---

## 📝 **Debug Mode**

Add console logs to Dashboard.jsx:
```javascript
useEffect(() => {
  const fetchData = async () => {
    console.log('Fetching maid profile...');
    console.log('isMaid:', isMaid);
    
    if (isMaid) {
      try {
        console.log('Calling API...');
        const response = await maidAPI.getMyProfile();
        console.log('API Response:', response.data);
        setMaidProfile(response.data);
      } catch (error) {
        console.error('API Error:', error);
        console.error('Error response:', error.response);
      }
    }
  };
  fetchData();
}, [isMaid]);
```

---

## 🎯 **Expected Behavior**

When working correctly:
1. Login as maid2
2. Dashboard loads
3. Profile image appears in header (top right)
4. Profile card appears below welcome message
5. Status indicator shows (green/red dot)
6. Profile info displays (name, location, rate)

---

## 📞 **Still Not Working?**

Check these files:
1. `/backend/maid/views.py` - Endpoint exists?
2. `/backend/maid/urls.py` - Route configured?
3. `/web/src/services/api.js` - Correct URL?
4. `/web/src/pages/Dashboard.jsx` - API call correct?
5. Browser console - Any errors?
6. Django logs - Any errors?

---

**Most Common Issue:** MaidProfile doesn't exist for the user!

**Quick Fix:**
```bash
cd backend
./venv/bin/python manage.py shell

from maid.models import MaidProfile
from accounts.models import User
user = User.objects.get(username='maid2')
MaidProfile.objects.get_or_create(
    user=user,
    defaults={
        'full_name': 'Maid2 Test',
        'location': 'Nairobi',
        'phone_number': user.phone_number,
        'availability_status': True
    }
)
```

Then refresh the browser!
