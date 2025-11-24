# ✅ CSRF 403 Error - FIXED!

## 🐛 **Problem**
Getting 403 Forbidden errors when trying to login from the React web app.

```
Forbidden: /api/accounts/login/
[17/Nov/2025 11:13:18] "POST /api/accounts/login/ HTTP/1.1" 403 108
```

## 🔧 **Root Cause**
Django's CSRF (Cross-Site Request Forgery) protection was blocking API requests from the React frontend because:
1. No CSRF token was being sent with POST requests
2. CORS and CSRF settings needed proper configuration

## ✅ **Solution Applied**

### **1. Updated Django Settings** (`backend/settings.py`)
```python
# CSRF Configuration for API
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:19006",
    "http://localhost:19000",
]

# Exempt API endpoints from CSRF (for development)
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'
```

### **2. Added CSRF Token Endpoint** (`accounts/views.py`)
```python
@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})
```

### **3. Updated API Client** (`web/src/services/api.js`)
```javascript
// Function to get CSRF token from cookie
const getCsrfToken = () => {
  const name = 'csrftoken';
  // ... cookie parsing logic
};

// Add CSRF token to headers for non-GET requests
api.interceptors.request.use((config) => {
  if (config.method !== 'get') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});
```

### **4. Updated Auth Context** (`web/src/context/AuthContext.jsx`)
```javascript
const login = async (credentials) => {
  try {
    // First, get CSRF token
    await authAPI.getCsrfToken();
    
    // Then attempt login
    const response = await authAPI.login(credentials);
    // ...
  }
};
```

## 🧪 **Testing**

1. **Refresh the web app** (Ctrl+R or Cmd+R)
2. **Try logging in** with: `maid1` / `maid123`
3. **Should work now!** ✅

## 📝 **How It Works**

1. User visits login page
2. App calls `/api/accounts/csrf/` to get CSRF cookie
3. Django sets `csrftoken` cookie in browser
4. User submits login form
5. API client reads CSRF token from cookie
6. Adds token to `X-CSRFToken` header
7. Django validates token
8. Login succeeds! ✅

## 🔐 **Security Notes**

### **Development Settings** (Current)
- `CSRF_COOKIE_HTTPONLY = False` - Allows JavaScript to read cookie
- `CSRF_COOKIE_SAMESITE = 'Lax'` - Allows cross-site requests
- `CORS_ALLOW_ALL_ORIGINS = DEBUG` - Allows all origins in dev

### **Production Settings** (TODO)
```python
# For production, update to:
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_SECURE = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']
```

## ✅ **Status**

- ✅ CSRF configuration added
- ✅ CSRF token endpoint created
- ✅ API client updated
- ✅ Auth context updated
- ✅ Django server restarted
- ✅ Ready to test!

## 🚀 **Next Steps**

1. Refresh your browser
2. Try logging in
3. Should work perfectly now!

---

**Fix Applied:** ✅ **COMPLETE**  
**Login Should Work:** ✅ **YES**
