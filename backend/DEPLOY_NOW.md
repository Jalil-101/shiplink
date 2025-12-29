# 🚀 Deploy Backend to Render - Quick Guide

## You have 2 options:

### Option A: Deploy from Same Repo (Easier) ⭐ RECOMMENDED
Deploy the backend from your existing `shiplink-fullstack` repo.

### Option B: Separate Backend Repo
Create a new GitHub repo just for the backend.

---

## ✅ Option A: Deploy from Same Repo (Recommended)

### Step 1: Make Sure Code is Committed
```bash
# From project root
git add backend/
git commit -m "Add backend code for deployment"
git push
```

### Step 2: Deploy to Render

1. **Go to Render**: https://render.com
2. **Sign up/Login** (use GitHub to sign in - it's free)
3. **Click "New +"** → **"Web Service"**
4. **Connect Repository**:
   - Select your GitHub account
   - Choose `shiplink-fullstack` repository
   - Click "Connect"

5. **Configure Service**:
   - **Name**: `shiplink-backend` (or any name you like)
   - **Environment**: `Node`
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or `master` if that's your branch)
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (for now)

6. **Set Environment Variables** (CRITICAL!):
   Click "Advanced" → "Add Environment Variable"
   
   Add these **3 variables**:
   
   **Variable 1:**
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority`
   
   **Variable 2:**
   - **Key**: `JWT_SECRET`
   - **Value**: `shiplink-super-secret-jwt-key-2024-change-this-in-production`
   (Or generate a secure one: https://randomkeygen.com/)
   
   **Variable 3:**
   - **Key**: `NODE_ENV`
   - **Value**: `production`

7. **Click "Create Web Service"**
8. **Wait for Deployment** (5-10 minutes)
   - Watch the "Logs" tab
   - You should see: `✅ Connected to MongoDB` and `🚀 Server running`
9. **Get Your URL**: `https://shiplink-backend.onrender.com` (or whatever name you chose)

### Step 3: Test Deployment

1. **Health Check**: Visit `https://your-app-name.onrender.com/health`
   - Should see: `{"status":"OK",...}`

2. **Test Registration** (optional):
   - Use Postman or curl to test the registration endpoint

### Step 4: Update Frontend

1. **Open**: `frontend/src/services/api.ts`
2. **Find**: `PRODUCTION_API_URL` (around line 58)
3. **Update to**: `https://your-app-name.onrender.com/api`
   (Replace `your-app-name` with your actual Render service name)

4. **Save and restart frontend**:
   ```bash
   # Stop current frontend (Ctrl+C)
   # Restart
   npm start
   ```

### Step 5: Test from App

1. Scan QR code again
2. Try registration
3. Should work now! 🎉

---

## ✅ Option B: Separate Backend Repo

If you prefer a separate repo:

### Step 1: Create New GitHub Repo
1. Go to: https://github.com/new
2. Repository name: `shiplink-backend`
3. Make it **Private** (optional)
4. Click "Create repository"

### Step 2: Push Backend Code
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shiplink-backend.git
git push -u origin main
```

### Step 3: Deploy to Render
Follow **Step 2** from Option A, but:
- Choose `shiplink-backend` repository
- **Root Directory**: Leave empty (or `.`)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

---

## 🔍 Important Notes

### MongoDB Network Access
Make sure MongoDB Atlas allows connections from anywhere:
1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Environment Variables
- **MONGODB_URI**: Use `%40` for `@` in password (already done above)
- **JWT_SECRET**: Can be any random string, but use a secure one for production
- **NODE_ENV**: Set to `production` for Render

### Render Free Tier
- Services may "sleep" after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (wake-up time)
- This is normal and free!

---

## ✅ Success Checklist

- [ ] Code committed to GitHub
- [ ] Render service created
- [ ] Environment variables set (MONGODB_URI, JWT_SECRET, NODE_ENV)
- [ ] Deployment successful (check logs)
- [ ] Health check works (`/health` endpoint)
- [ ] Frontend updated with new API URL
- [ ] Registration works from app

---

## 🆘 Troubleshooting

### Deployment Fails
- Check Render logs for errors
- Make sure `Root Directory` is set to `backend`
- Verify `package.json` exists in backend folder

### 500 Error After Deployment
- Check Render logs
- Verify all 3 environment variables are set
- Check MongoDB network access

### Can't Connect to MongoDB
- Verify MongoDB Atlas network access allows 0.0.0.0/0
- Check connection string is correct
- Make sure password uses `%40` for `@`

---

## 🎯 Next Steps After Deployment

1. ✅ Test registration from app
2. ✅ Test login
3. ✅ Test creating delivery requests
4. ✅ Test driver features (if applicable)

---

**Need help?** Check the Render logs - they show exactly what's wrong!

