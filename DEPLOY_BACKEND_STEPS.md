the # 🚀 Deploy Backend to Render - Simple Steps

## Step 1: Commit Backend Code to GitHub

Run these commands in your terminal (from project root):

```powershell
# Add backend folder
git add backend/

# Commit
git commit -m "Add backend code for Render deployment"

# Push to GitHub
git push
```

---

## Step 2: Deploy to Render

### 2.1 Go to Render

1. Visit: **https://render.com**
2. **Sign up** (free) or **Login** (use GitHub to sign in - easiest!)

### 2.2 Create New Web Service

1. Click **"New +"** button (top right)
2. Click **"Web Service"**

### 2.3 Connect Your Repository

1. **Connect GitHub** (if not already connected)
2. Find and select your **`shiplink-fullstack`** repository
3. Click **"Connect"**

### 2.4 Configure Service Settings

Fill in these settings:

- **Name**: `shiplink-backend` (or any name)
- **Environment**: `Node`
- **Region**: Choose closest (e.g., `Oregon (US West)`)
- **Branch**: `master` (or `main` if that's your branch)
- **Root Directory**: `backend` ⚠️ **VERY IMPORTANT!**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: **Free** (select this)

### 2.5 Set Environment Variables (CRITICAL!)

Click **"Advanced"** → Scroll down to **"Environment Variables"**

Click **"Add Environment Variable"** and add these **3 variables**:

**Variable 1:**

- **Key**: `MONGODB_URI`
- **Value**: `mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority`

**Variable 2:**

- **Key**: `JWT_SECRET`
- **Value**: `shiplink-super-secret-jwt-key-2024-change-this-in-production`

**Variable 3:**

- **Key**: `NODE_ENV`
- **Value**: `production`

### 2.6 Deploy!

1. Scroll down
2. Click **"Create Web Service"**
3. **Wait 5-10 minutes** for deployment
4. Watch the **"Logs"** tab - you should see:
   - `✅ Connected to MongoDB`
   - `🚀 Server running on port 10000`
   - `🔐 JWT Secret: Set ✅`

### 2.7 Get Your Backend URL

Once deployed, you'll see your URL at the top:

- Example: `https://shiplink-backend.onrender.com`
- **Copy this URL!**

---

## Step 3: Update Frontend

1. **Open**: `frontend/src/services/api.ts`
2. **Find line 58** (or search for `PRODUCTION_API_URL`)
3. **Update**:

   ```typescript
   const PRODUCTION_API_URL = "https://YOUR-APP-NAME.onrender.com/api";
   ```

   Replace `YOUR-APP-NAME` with your actual Render service name

4. **Save the file**

---

## Step 4: Test!

1. **Restart your frontend**:

   - Stop it (Ctrl+C if running)
   - Run `npm start` again

2. **Scan QR code** with Expo Go

3. **Try registration** - should work now! 🎉

---

## ✅ Checklist

- [ ] Backend code committed to GitHub
- [ ] Render account created
- [ ] Web service created on Render
- [ ] Root directory set to `backend`
- [ ] All 3 environment variables added
- [ ] Deployment successful (check logs)
- [ ] Health check works: `https://your-app.onrender.com/health`
- [ ] Frontend updated with new API URL
- [ ] Registration works from app

---

## 🆘 Troubleshooting

### Deployment Fails

- Check **Render Logs** tab for errors
- Make sure **Root Directory** is exactly `backend` (not `./backend` or `/backend`)
- Verify `package.json` exists in backend folder

### 500 Error After Deployment

- Check **Render Logs** for specific error
- Verify all 3 environment variables are set correctly
- Check MongoDB Atlas → Network Access → Allow 0.0.0.0/0

### MongoDB Connection Error

1. Go to **MongoDB Atlas** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

---

## 🎯 That's It!

Once deployed, your backend will be live and your app will work! 🚀
