# 🚀 Vercel Deployment Guide - Step by Step

## Quick Deploy (5 Minutes)

### Step 1: Go to Vercel

1. Open browser: https://vercel.com
2. Click **"Sign Up"** (or Login if you have account)
3. Choose **"Continue with GitHub"** (recommended)

### Step 2: Import Your Project

1. After login, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find **"Shiplink_Frontend"** (or your repo name)
4. Click **"Import"**

### Step 3: Configure Project

1. **Framework Preset**: Should auto-detect "Next.js" ✅
2. **Root Directory**: Click "Edit" and set to: `admin`
   - This tells Vercel where your Next.js app is
3. **Build Command**: Leave default (`npm run build`)
4. **Output Directory**: Leave default (`.next`)
5. **Install Command**: Leave default (`npm install`)

### Step 4: Add Environment Variable

1. Scroll down to **"Environment Variables"**
2. Click **"Add"**
3. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://shiplink-q4hu.onrender.com`
4. Click **"Save"**

### Step 5: Deploy

1. Click **"Deploy"** button (bottom right)
2. Wait 2-3 minutes for build to complete
3. You'll see: **"Congratulations! Your project has been deployed"**

### Step 6: Access Your Dashboard

1. Click the deployment URL (e.g., `https://shiplink-admin.vercel.app`)
2. You'll see the admin login page
3. Login with your admin credentials

---

## 📸 Visual Guide

### After Import:

```
┌─────────────────────────────────┐
│ Configure Project               │
├─────────────────────────────────┤
│ Framework Preset: Next.js ✅    │
│ Root Directory: [admin] ← Edit  │
│ Build Command: npm run build    │
│                                 │
│ Environment Variables:          │
│ ┌─────────────────────────────┐ │
│ │ NEXT_PUBLIC_API_URL         │ │
│ │ https://shiplink-q4hu...    │ │
│ └─────────────────────────────┘ │
│                                 │
│         [Deploy] ← Click        │
└─────────────────────────────────┘
```

---

## 🔍 Verify Deployment

### Check 1: Build Logs

- After deployment, check "Deployments" tab
- Look for green checkmark ✅
- If red ❌, check error logs

### Check 2: Access Dashboard

1. Visit your Vercel URL
2. Should see login page
3. If you see 404, check root directory is set to `admin`

### Check 3: API Connection

1. Login to admin dashboard
2. Try accessing any page (Users, Products, etc.)
3. If errors, verify `NEXT_PUBLIC_API_URL` is correct

---

## 🐛 Common Issues

### Issue: "404 Not Found"

**Fix**: Set Root Directory to `admin` in project settings

### Issue: "API Connection Failed"

**Fix**:

1. Check `NEXT_PUBLIC_API_URL` environment variable
2. Verify backend is running: `https://shiplink-q4hu.onrender.com/health`
3. Check CORS settings on backend

### Issue: "Build Failed"

**Fix**:

1. Check build logs in Vercel
2. Ensure `admin/package.json` exists
3. Verify Node.js version (should be 18+)

---

## 🔄 Updating Deployment

### Auto-Deploy (Recommended)

- Vercel auto-deploys when you push to GitHub
- Just push code: `git push origin master`
- Vercel will rebuild automatically

### Manual Deploy

1. Go to Vercel dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click "Redeploy" on latest deployment

---

## 📱 Custom Domain (Optional)

1. Go to project settings
2. Click "Domains"
3. Add your domain (e.g., `admin.shiplink.com`)
4. Follow DNS instructions

---

## ✅ Success Checklist

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `admin`
- [ ] Environment variable added
- [ ] Deployment successful
- [ ] Admin dashboard accessible
- [ ] Login works
- [ ] API connection works

---

## 🎉 You're Done!

Your admin dashboard is now live at:
**`https://your-project-name.vercel.app`**

Share this URL with your team to access the admin panel remotely!

---

**Need Help?** Check Vercel docs: https://vercel.com/docs
