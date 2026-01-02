# Environment Variables Setup Guide

## Quick Setup

### Backend (Render.com)

**Go to Render Dashboard → Your Backend Service → Environment**

Add these variables:

```
JWT_SECRET=<generate with: openssl rand -base64 32>
MONGODB_URI=<your MongoDB connection string>
NODE_ENV=production
PORT=5444
```

**How to set:**
1. Log into Render.com
2. Click your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable above
6. Save changes (service will restart)

### Frontend (EAS Build / Expo)

**Option 1: EAS Build Config (Recommended)**

Edit `frontend/eas.json` and add:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://shiplink-q4hu.onrender.com/api"
      }
    }
  }
}
```

**Option 2: Build-time Environment Variable**

When building with EAS:
```bash
eas build --platform ios --profile production --env EXPO_PUBLIC_API_BASE_URL=https://shiplink-q4hu.onrender.com/api
```

**Note:** The production URL is already hardcoded as fallback in `frontend/src/services/api.ts`, so builds will work even without setting this.

## Local Development

### Backend
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your local values

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env`
2. Uncomment and set your local backend URL if needed

## Verification

**Backend:**
- Check Render logs for: `✅ Connected to MongoDB`
- Test: `curl https://shiplink-q4hu.onrender.com/health`

**Frontend:**
- Check Expo console for: `[API] Using base URL: https://shiplink-q4hu.onrender.com/api`
- Test API calls work in the app

