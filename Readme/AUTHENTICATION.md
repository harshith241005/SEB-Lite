# 🔐 Authentication & Security Guide

## Overview

SEB-Lite uses **JWT (JSON Web Token) authentication** with enhanced security features including refresh tokens, token blacklisting, rate limiting, and session management.

---

## 📍 Where Authentication Data is Stored

### Backend (Server-Side)
- **MongoDB Database:**
  - `users` collection: User credentials (hashed passwords)
  - `tokens` collection: Blacklisted/revoked tokens
  - `sessions` collection: Active user sessions

### Frontend (Client-Side)
- **localStorage:**
  - `accessToken`: Short-lived access token (15 minutes)
  - `refreshToken`: Long-lived refresh token (7 days)
  - `user`: User profile data (name, email, role)
  - `token`: Legacy token (for backward compatibility)

---

## 🔑 Authentication Flow

### 1. **Registration**
```
User → POST /api/auth/register
  ↓
Server validates input
  ↓
Password hashed (bcrypt, 12 salt rounds)
  ↓
User created in database
  ↓
Access Token (15min) + Refresh Token (7 days) generated
  ↓
Session created
  ↓
Tokens returned to client
```

### 2. **Login**
```
User → POST /api/auth/login
  ↓
Server validates credentials
  ↓
Password verified (bcrypt.compare)
  ↓
Access Token (15min) + Refresh Token (7 days) generated
  ↓
Old sessions deactivated (same device)
  ↓
New session created
  ↓
Tokens returned to client
```

### 3. **Token Refresh**
```
Client → POST /api/auth/refresh (with refreshToken)
  ↓
Server validates refresh token
  ↓
Checks token blacklist
  ↓
Verifies session is active
  ↓
Old refresh token blacklisted
  ↓
New Access Token + Refresh Token generated
  ↓
Session updated
  ↓
New tokens returned
```

### 4. **API Request with Token**
```
Client → API Request (with Access Token in header)
  ↓
Server middleware checks:
  - Token exists?
  - Token not blacklisted?
  - Token valid and not expired?
  - Token type is "access"?
  ↓
Request proceeds or 401 Unauthorized
```

---

## 🛡️ Security Features

### ✅ **1. JWT Authentication**
- **Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Token Payload**: Contains userId, email, role, type

### ✅ **2. Token Blacklisting**
- Revoked tokens stored in database
- Prevents reuse of logged-out tokens
- Auto-expires when token expiry time passes

### ✅ **3. Session Management**
- Active sessions tracked in database
- Device information stored (IP, User-Agent, Platform)
- Can revoke specific sessions
- Last activity timestamp

### ✅ **4. Rate Limiting**
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **API**: 100 requests per 15 minutes per IP

### ✅ **5. Password Security**
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters
- **Storage**: Never stored in plain text

### ✅ **6. Token Rotation**
- Refresh tokens rotated on each refresh
- Old tokens automatically blacklisted
- Prevents token reuse attacks

### ✅ **7. Automatic Token Refresh**
- Frontend automatically refreshes expired tokens
- Seamless user experience
- Queue system prevents duplicate refresh requests

---

## 🔄 Token Lifecycle

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Access Token    │ ◄─── 15 minutes
│ (15 min)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Requests    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Token Expired?  │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Yes    │  No
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Refresh │  │ Continue│
│ Token   │  │         │
└────┬────┘  └─────────┘
     │
     ▼
┌─────────────────┐
│ New Access Token│
└─────────────────┘
```

---

## 📝 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| GET | `/api/auth/sessions` | Get active sessions | ✅ |
| DELETE | `/api/auth/sessions/:id` | Revoke session | ✅ |

---

## 🔧 Configuration

### Environment Variables

```env
# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# Token Expiry
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Server
PORT=5001
NODE_ENV=production
```

### Token Expiry Times

- **Access Token**: 15 minutes (short-lived for security)
- **Refresh Token**: 7 days (long-lived for convenience)

---

## 🚀 Usage Examples

### Frontend: Login
```javascript
import { setAuthTokens } from '../utils/auth';
import axios from '../utils/api';

const response = await axios.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Store tokens
setAuthTokens(
  response.data.accessToken,
  response.data.refreshToken,
  response.data.user
);
```

### Frontend: Making Authenticated Requests
```javascript
import axiosInstance from '../utils/api';

// Token automatically added to headers
const response = await axiosInstance.get('/exam');
```

### Frontend: Logout
```javascript
import { logout } from '../utils/auth';

await logout(); // Clears tokens and calls logout API
```

### Backend: Protected Route
```javascript
const authMiddleware = require('../middleware/authMiddleware');

router.get('/protected', authMiddleware, (req, res) => {
  // req.userId, req.email, req.role available
  res.json({ message: 'Protected data' });
});
```

---

## 🔒 Security Best Practices

### ✅ Implemented
- ✅ JWT with short-lived access tokens
- ✅ Refresh token rotation
- ✅ Token blacklisting
- ✅ Rate limiting
- ✅ Password hashing (bcrypt)
- ✅ Session management
- ✅ Automatic token refresh
- ✅ Secure token storage

### 🔄 Recommended for Production
- [ ] Use httpOnly cookies (instead of localStorage)
- [ ] Implement 2FA/MFA
- [ ] Add CSRF protection
- [ ] Use HTTPS only
- [ ] Implement IP whitelisting
- [ ] Add account lockout after failed attempts
- [ ] Email verification
- [ ] Password reset flow
- [ ] Audit logging

---

## 🆚 Comparison: Current vs. Better Options

### Current Implementation (JWT with Refresh Tokens)
✅ **Pros:**
- Stateless (scalable)
- Works across multiple servers
- Short-lived access tokens
- Token revocation support
- Automatic refresh

❌ **Cons:**
- localStorage vulnerable to XSS
- Can't revoke immediately (until expiry)
- Larger token size

### Alternative: httpOnly Cookies
✅ **Pros:**
- XSS protection (httpOnly)
- CSRF protection (SameSite)
- Automatic inclusion in requests

❌ **Cons:**
- Requires CSRF tokens
- More complex setup
- CORS considerations

### Alternative: OAuth 2.0 / OIDC
✅ **Pros:**
- Industry standard
- Third-party integration
- Advanced features

❌ **Cons:**
- More complex
- External dependencies
- Overkill for simple apps

---

## 📊 Token Storage Comparison

| Storage Method | XSS Protection | CSRF Protection | Accessibility | Best For |
|----------------|----------------|-----------------|---------------|----------|
| **localStorage** | ❌ | ✅ | JavaScript | SPA, Electron |
| **httpOnly Cookies** | ✅ | ✅ (with SameSite) | HTTP only | Web apps |
| **sessionStorage** | ❌ | ✅ | JavaScript | Single tab |
| **Memory** | ✅ | ✅ | Runtime only | High security |

**Current Choice**: localStorage (good for Electron apps, but httpOnly cookies would be better for web)

---

## 🐛 Troubleshooting

### Token Expired Error
**Problem**: `401 Unauthorized - Token expired`
**Solution**: Frontend automatically refreshes token. If refresh fails, user redirected to login.

### Invalid Token Error
**Problem**: `401 Unauthorized - Invalid token`
**Solution**: 
1. Check if token is blacklisted
2. Verify JWT_SECRET matches
3. Clear localStorage and re-login

### Rate Limit Error
**Problem**: `429 Too Many Requests`
**Solution**: Wait for rate limit window to expire (15 min for login, 1 hour for registration)

---

## 📚 Additional Resources

- [JWT.io](https://jwt.io/) - JWT Debugger
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

---

## ✅ Summary

**Current Authentication**: ✅ **JWT with Refresh Tokens**

**Where Data is Stored:**
- **Backend**: MongoDB (users, tokens, sessions)
- **Frontend**: localStorage (accessToken, refreshToken, user)

**Security Level**: ⭐⭐⭐⭐ (4/5)
- Strong password hashing
- Token blacklisting
- Rate limiting
- Session management
- Automatic token refresh

**Recommendation**: Current implementation is **production-ready** for Electron apps. For web apps, consider migrating to **httpOnly cookies** for better XSS protection.
