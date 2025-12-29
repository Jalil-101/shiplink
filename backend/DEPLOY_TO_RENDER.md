# Deploy Backend to Render - Step by Step

## 🚨 Current Issue

Your backend is returning 500 errors because it's likely:
1. Not deployed to Render yet, OR
2. Deployed but missing environment variables

## ✅ Solution: Deploy Backend to Render

### Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial backend commit"
   ```

2. **Create GitHub Repository**:
   - Go to: https://github.com/new
   - Repository name: `shiplink-backend` (or any name)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/shiplink-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Render

1. **Go to Render**: https://render.com
2. **Sign up/Login** (use GitHub to sign in)
3. **Click "New +"** → **"Web Service"**
4. **Connect Repository**:
   - Select your GitHub account
   - Choose `shiplink-backend` repository
   - Click "Connect"

5. **Configure Service**:
   - **Name**: `shiplink-backend` (or any name)
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend` (if your repo has frontend/backend folders)
   - **Build Command**: `cd backend && npm install` (or just `npm install` if root is backend)
   - **Start Command**: `cd backend && npm start` (or just `npm start` if root is backend)

6. **Set Environment Variables** (CRITICAL!):
   Click "Advanced" → "Add Environment Variable"
   
   Add these:
   ```
   MONGODB_URI = mongodb+srv://abdulmahama30_db_user:%40Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink?retryWrites=true&w=majority
   ```
   
   ```
   JWT_SECRET = shiplink-super-secret-jwt-key-2024-change-this-in-production
   ```
   
   ```
   NODE_ENV = production
   ```
   
   **Important**: 
   - Use `%40` for the `@` in password
   - Generate a random JWT_SECRET (use https://randomkeygen.com/)
   - Don't set PORT (Render sets it automatically)

7. **Click "Create Web Service"**
8. **Wait for Deployment** (5-10 minutes)
9. **Get Your URL**: `https://your-app-name.onrender.com`

### Step 3: Test Deployment

1. **Health Check**: Visit `https://your-app-name.onrender.com/health`
   - Should see: `{"status":"OK",...}`

2. **Test Registration** (using curl or Postman):
   ```bash
   curl -X POST https://your-app-name.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "phone": "1234567890",
       "password": "password123",
       "role": "customer"
     }'
   ```

### Step 4: Update Frontend

1. **Open**: `frontend/src/services/api.ts`
2. **Find**: `PRODUCTION_API_URL`
3. **Update to**: `https://your-app-name.onrender.com/api`

### Step 5: Test Frontend

1. Restart frontend: `npm start`
2. Try registration again
3. Should work now!

---

## 🔍 Troubleshooting

### Backend Returns 500 Error

**Check Render Logs**:
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for error messages

**Common Issues**:
- ❌ Missing `MONGODB_URI` → Add it in Environment Variables
- ❌ Missing `JWT_SECRET` → Add it in Environment Variables
- ❌ Wrong connection string → Check password encoding (`%40` for `@`)
- ❌ MongoDB network access → Allow Render's IP in Atlas

### MongoDB Network Access

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for now)
4. Or add Render's IP addresses

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Service created on Render
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check works
- [ ] Frontend updated with new URL
- [ ] Registration works

---

## 🎯 Quick Fix for Now

If you want to test locally first:

1. **Make sure backend is running locally**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Update frontend to use localhost** (for testing):
   - In `frontend/src/services/api.ts`
   - Make sure it uses `http://localhost:5444/api` in development

3. **Make sure phone and computer are on same network**

4. **Use your computer's IP address** instead of localhost:
   - Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update API URL to: `http://YOUR_IP:5444/api`

But for production, you need to deploy to Render!

