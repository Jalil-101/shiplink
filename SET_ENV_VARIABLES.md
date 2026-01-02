# How to Set Production Environment Variables

## Backend (Render.com) - DO THIS NOW

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click your backend service** (the one running on Render)
3. **Click "Environment" tab** (left sidebar)
4. **Add these 3 variables** (click "Add Environment Variable" for each):

   ```
   Name: JWT_SECRET
   Value: [Generate with: openssl rand -base64 32]
   ```

   ```
   Name: MONGODB_URI
   Value: [Your MongoDB connection string]
   ```

   ```
   Name: NODE_ENV
   Value: production
   ```

5. **Save** - Render will automatically restart your service

**To generate JWT_SECRET:**
- Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- Or use: https://www.grc.com/passwords.htm (64 random printable ASCII characters)

## Frontend - ALREADY DONE

✅ **The production URL is already set in code!**

The file `frontend/src/services/api.ts` line 58 has:
```typescript
const PRODUCTION_API_URL = "https://shiplink-q4hu.onrender.com/api";
```

This is used automatically in production builds. **No action needed.**

If you want to override it for a specific build, add to `frontend/eas.json`:
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

## Verify It's Working

**Backend:**
- Check Render logs - should see: `✅ Connected to MongoDB`
- Test: Open https://shiplink-q4hu.onrender.com/health in browser

**Frontend:**
- Build and test - API calls should work automatically

