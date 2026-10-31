# Authentication System Setup Guide

## Overview

A complete JWT-based authentication system has been added to the Hisab Ledger application with beautiful animations using Framer Motion.

## Features

### Frontend
- **Login Page** (`src/pages/Login.tsx`)
  - Email/password authentication
  - Password visibility toggle
  - Remember me checkbox
  - Beautiful gradient background
  - Smooth fade-in animations
  - Form validation with error messages
  - Success notifications

- **Register Page** (`src/pages/Register.tsx`)
  - User registration with name, email, password
  - Password confirmation
  - Password strength indicators
  - Form validation
  - Smooth page transitions

- **Authentication Context** (`src/contexts/AuthContext.tsx`)
  - Global auth state management
  - Auto-login from stored token
  - Token management in localStorage
  - Error handling

- **Protected Routes** (`src/components/PrivateRoute.tsx`)
  - Automatic redirect to login if not authenticated
  - Loading state handling
  - Secure route wrapping

- **Beautiful Animations**
  - Framer Motion for smooth transitions
  - Fade-in animations on page load
  - Slide animations for form inputs
  - Button hover and tap effects
  - Input focus animations
  - Staggered element animations
  - Floating background elements
  - Success/error toast animations

### Backend
- **Login Endpoint** (`POST /api/auth/login/`)
  - Email and password authentication
  - JWT token generation
  - User data response

- **Register Endpoint** (`POST /api/auth/register/`)
  - User account creation
  - Duplicate email/username prevention
  - JWT token generation
  - Immediate authentication after signup

## Installation & Setup

### Backend Setup

1. **Install JWT dependency** (already in requirements.txt):
   ```bash
   pip install djangorestframework-simplejwt
   ```

2. **Update Django settings** (already configured in `config/settings.py`):
   ```python
   REST_FRAMEWORK = {
       'DEFAULT_AUTHENTICATION_CLASSES': [
           'rest_framework_simplejwt.authentication.JWTAuthentication',
           'rest_framework.authentication.SessionAuthentication',
           'rest_framework.authentication.BasicAuthentication',
       ],
       'DEFAULT_PERMISSION_CLASSES': [
           'rest_framework.permissions.AllowAny',
       ],
   }

   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
       'ROTATE_REFRESH_TOKENS': True,
       'BLACKLIST_AFTER_ROTATION': True,
       'ALGORITHM': 'HS256',
       'SIGNING_KEY': SECRET_KEY,
   }
   ```

3. **Run Django migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Start Django server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install dependencies** (including Framer Motion):
   ```bash
   cd frontend
   npm install
   ```

2. **Environment configuration** (optional, in `frontend/.env`):
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Endpoints

#### Register
```
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "",
    "last_name": ""
  }
}
```

#### Login
```
POST /api/auth/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "",
    "last_name": ""
  }
}
```

## File Structure

```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state management
│   ├── components/
│   │   ├── PrivateRoute.tsx         # Protected route wrapper
│   │   └── Header.tsx               # Updated with logout
│   ├── pages/
│   │   ├── Login.tsx                # Beautiful login page
│   │   ├── Register.tsx             # Beautiful register page
│   │   └── ...existing pages
│   ├── api/
│   │   └── client.ts                # Updated with auth endpoints
│   └── App.tsx                      # Updated with auth routes

hisab/
├── views.py                         # Updated with LoginView, RegisterView
├── urls.py                          # Updated with auth routes
└── ...existing files
```

## Usage

### From Login Page
1. User navigates to `http://localhost:5173/login`
2. Enters email and password
3. System authenticates with backend
4. JWT token stored in localStorage
5. Redirect to dashboard

### From Register Page
1. User navigates to `http://localhost:5173/register`
2. Fills in name, email, password, confirm password
3. System creates account and authenticates
4. JWT token stored in localStorage
5. Redirect to dashboard

### Protected Pages
- All pages except login/register require authentication
- If token is missing or invalid, user is redirected to login
- Token is automatically included in all API requests
- If 401 is received, user is logged out and redirected

## Animation Details

### Login Page Animations
- **Container**: Fade-in with staggered children
- **Card**: Scale hover effect
- **Header**: Smooth text fade-in
- **Input Fields**: Scale on focus (1.02x)
- **Icons**: Animated visibility toggle
- **Buttons**: Hover scale (1.02x), tap scale (0.98x)
- **Error/Success Messages**: Slide in from top
- **Background Elements**: Floating motion at different speeds
- **Loading Spinner**: Continuous rotation

### Register Page Animations
- **Similar to Login** with purple gradient theme
- **Staggered input animations** for better UX
- **Password strength indicator** support

## Security Features

1. **JWT Token Authentication**
   - Tokens stored in localStorage
   - Automatic token inclusion in API headers
   - Token expiration handling

2. **Protected Routes**
   - Routes require authentication
   - Automatic redirect for unauthenticated users
   - Loading state during token verification

3. **Password Security**
   - Minimum 8 characters required
   - Visibility toggle for better UX
   - Passwords never logged or exposed

4. **Error Handling**
   - User-friendly error messages
   - Specific validation errors
   - Server error handling

5. **CORS Configuration**
   - Configured for localhost:3000 and localhost:5173
   - Production URLs can be added as needed

## Customization

### Changing Color Schemes
- **Login**: Blue to Purple gradient (`from-blue-600 to-purple-600`)
- **Register**: Purple to Blue gradient (`from-purple-600 to-blue-600`)
- Edit the gradient classes in `Login.tsx` and `Register.tsx`

### Modifying Token Lifetime
Edit `config/settings.py`:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),  # Change hours
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),  # Change days
}
```

### Animation Speed
Edit animation transitions in Login.tsx/Register.tsx:
```typescript
transition: { duration: 0.5, ease: 'easeOut' }  // Adjust duration
```

### Password Requirements
Edit validation in `Register.tsx`:
```typescript
if (password.length < 10) {  // Change minimum length
    setLocalError('Password must be at least 10 characters');
}
```

## Testing

### Test Login
1. Create a test user via register or admin panel
2. Navigate to login page
3. Enter email and password
4. Verify redirect to dashboard
5. Check browser localStorage for `authToken`

### Test Protected Routes
1. Clear localStorage: `localStorage.removeItem('authToken')`
2. Try accessing a protected route
3. Should redirect to login

### Test Logout
1. Click logout button in header
2. Token should be removed from localStorage
3. Should redirect to login page

## Troubleshooting

### Issue: Login fails with "Invalid email or password"
- **Solution**: Ensure backend is running and user exists
- Check email/password combination

### Issue: CORS errors
- **Solution**: Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `config/settings.py`

### Issue: Infinite redirect loop
- **Solution**: Clear localStorage and cookies
- Verify JWT_SECRET_KEY is set correctly

### Issue: Animations not working
- **Solution**: Ensure Framer Motion is installed: `npm install framer-motion`
- Check console for errors

## Dependencies Added

### Frontend
- `framer-motion@^10.16.16` - Smooth animations

### Backend
- Already included: `djangorestframework-simplejwt>=5.2,<6.0`

## Next Steps

1. Customize styling to match your brand
2. Add email verification for registration
3. Add password reset functionality
4. Add two-factor authentication
5. Add user profile management
6. Add social login (Google, GitHub, etc.)

## Support

For issues or questions about the authentication system, refer to:
- Framer Motion docs: https://www.framer.com/motion/
- Django REST Framework JWT: https://django-rest-framework-simplejwt.readthedocs.io/
- React Router: https://reactrouter.com/

---

**Last Updated**: 2024
**Version**: 1.0
