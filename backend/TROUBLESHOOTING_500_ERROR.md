# 🔧 Troubleshooting 500 Error on Registration

## ✅ Good News
Your backend **IS deployed** and running! The health check works:
- ✅ Backend URL: `https://shilink-backend.onrender.com`
- ✅ Health endpoint: Working
- ❌ Registration endpoint: Returning 500 error

## 🔍 Root Cause
The 500 error is likely due to **missing environment variables** on Render.

## 🚀 Solution: Check Render Environment Variables

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Login to your account
3. Find your `shilink-backend` service
4. Click on it

### Step 2: Check Environment Variables
1. Click **"Environment"** tab (or **"Settings"** → **"Environment Variables"**)
2. Verify these variables exist:

```
MONGODB_URI = mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
```

```
JWT_SECRET = (any random string, e.g., shiplink-super-secret-jwt-key-2024)
```

```
NODE_ENV = production
```

### Step 3: Check Render Logs
1. In Render dashboard, click **"Logs"** tab
2. Look for error messages when you try to register
3. Common errors you might see:
   - `JWT_SECRET is not configured`
   - `MongoDB connection error`
   - `ValidationError: ...`

### Step 4: Add Missing Variables
If any are missing:
1. Click **"Add Environment Variable"**
2. Add the missing variable
3. Click **"Save Changes"**
4. **Wait for automatic redeploy** (1-2 minutes)

### Step 5: Test Again
After redeploy, try registration again from your app.

---

## 🔍 Common Issues & Fixes

### Issue 1: JWT_SECRET Missing
**Error in logs**: `JWT_SECRET is not configured`

**Fix**:
1. Generate a random secret: https://randomkeygen.com/
2. Add to Render: `JWT_SECRET = (your generated secret)`
3. Redeploy

### Issue 2: MongoDB Connection Failed
**Error in logs**: `MongoDB connection error` or `authentication failed`

**Fix**:
1. Check MongoDB Atlas → Network Access
2. Make sure **"Allow Access from Anywhere"** (0.0.0.0/0) is enabled
3. Verify password in connection string is correct
4. Make sure `%40` is used for `@` in password

### Issue 3: Phone Number Format
**Error**: Phone validation fails

**Fix**: The backend now automatically cleans phone numbers (removes spaces, dashes, parentheses). But if you still get errors:
- Make sure phone has at least 8 digits after cleaning
- Example: `+1 (380) 272-8276` → `13802728276` (11 digits, ✅)

---

## 🧪 Test Backend Directly

You can test the backend using PowerShell:

```powershell
# Test Health
Invoke-WebRequest -Uri "https://shilink-backend.onrender.com/health" -Method GET

# Test Registration
$body = @{
    name = "Test User"
    email = "test@example.com"
    phone = "1234567890"
    password = "password123"
    role = "customer"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://shilink-backend.onrender.com/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## ✅ Success Checklist

- [ ] Backend health check works
- [ ] All environment variables set in Render
- [ ] MongoDB connection successful (check logs)
- [ ] JWT_SECRET is set
- [ ] Registration endpoint returns 201 (not 500)
- [ ] Frontend can register users

---

## 📞 Still Not Working?

1. **Check Render Logs** - They will show the exact error
2. **Share the error message** from logs
3. **Verify MongoDB Atlas** - Network access and credentials
4. **Check Render Status** - https://status.render.com

---

## 🎯 Quick Fix Summary

**Most likely issue**: Missing `JWT_SECRET` in Render environment variables.

**Quick fix**:
1. Go to Render → Your Service → Environment
2. Add: `JWT_SECRET = shiplink-secret-key-2024-change-me`
3. Save and wait for redeploy
4. Try again!


