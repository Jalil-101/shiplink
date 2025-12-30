# 🚨 Quick Fix: 500 Error on Registration

## Problem
- ✅ Backend is deployed and running (`https://shilink-backend.onrender.com`)
- ✅ Health check works
- ❌ Registration returns 500 Internal Server Error

## Root Cause
**Missing `JWT_SECRET` environment variable** on Render.

## Solution (5 minutes)

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Login
3. Find your backend service (`shilink-backend` or similar)
4. Click on it

### Step 2: Add JWT_SECRET
1. Click **"Environment"** tab (or **"Settings"** → **"Environment"**)
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `JWT_SECRET`
   - **Value**: `shiplink-super-secret-jwt-key-2024-change-this-in-production`
4. Click **"Save Changes"**

### Step 3: Verify Other Variables
Make sure these also exist:
- ✅ `MONGODB_URI` = `mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority`
- ✅ `JWT_SECRET` = (any random string)
- ✅ `NODE_ENV` = `production` (optional)

### Step 4: Wait for Redeploy
- Render will automatically redeploy (1-2 minutes)
- Watch the "Logs" tab to see when it's done
- Look for: `✅ Connected to MongoDB` and `🔐 JWT Secret: Set ✅`

### Step 5: Test
Try registration again from your app. It should work now!

---

## Check Logs (If Still Not Working)

1. In Render dashboard → **"Logs"** tab
2. Look for error messages
3. Common errors:
   - `JWT_SECRET is not configured` → Add it (Step 2 above)
   - `MongoDB connection error` → Check MongoDB Atlas network access
   - `ValidationError` → Check the error message for details

---

## Generate Secure JWT_SECRET

For production, use a secure random string:
- Visit: https://randomkeygen.com/
- Copy a "CodeIgniter Encryption Keys" value
- Use that as your `JWT_SECRET`

---

## ✅ Success Indicators

After fixing, you should see in Render logs:
```
✅ Connected to MongoDB
📊 Database: shiplink
🚀 Server running on port 10000
🔐 JWT Secret: Set ✅
```

And registration should return `201 Created` instead of `500`.


