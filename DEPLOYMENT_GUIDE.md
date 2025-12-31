# ShipLink - Complete Deployment Guide

## 📋 Project Overview

**ShipLink** is a full-stack delivery and marketplace platform with:
- **Mobile App** (React Native/Expo) - For users and drivers
- **Backend API** (Node.js/Express) - RESTful API with Socket.io for real-time updates
- **Admin Dashboard** (Next.js) - Web-based admin panel

---

## 🚀 Deployment Status

### ✅ Backend
- **Status**: Deployed on Render
- **URL**: `https://shiplink-q4hu.onrender.com`
- **Auto-Deploy**: Configured (pushes to GitHub trigger rebuilds)

### ⏳ Admin Dashboard
- **Status**: Ready for deployment
- **Platform**: Vercel (recommended) or Render
- **Guide**: See below

### 📱 Mobile App
- **Status**: Ready for APK build
- **Platform**: EAS Build (Expo)

---

## 📦 Complete Feature List

### Backend Features
- ✅ User & Driver Authentication (JWT)
- ✅ Delivery Request System
- ✅ Driver Verification & Management
- ✅ Real-time Updates (Socket.io)
- ✅ Marketplace (Products, Cart, Orders)
- ✅ Admin API Endpoints
- ✅ Content Management System
- ✅ Analytics & Reporting
- ✅ Financial Management
- ✅ Notification System

### Admin Dashboard Features
- ✅ Admin Authentication
- ✅ User Management (view, suspend, force logout)
- ✅ Driver Verification (approve/reject, request re-upload)
- ✅ Delivery Oversight (view, reassign, resolve disputes)
- ✅ Product Management (CRUD, categories, images)
- ✅ Order Management (view, filter, update status)
- ✅ Content Management (announcements, banners, FAQ)
- ✅ Analytics Dashboard
- ✅ Financial Management (payouts, earnings)
- ✅ Settings (free delivery toggle, pricing)
- ✅ System Health Monitoring

### Mobile App Features
- ✅ User Registration & Login
- ✅ Profile Management
- ✅ Create Delivery Requests
- ✅ Track Deliveries
- ✅ Driver Dashboard
- ✅ Marketplace (browse, cart, checkout)
- ✅ Real-time Updates
- ✅ Order History

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5444
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

### Admin Dashboard (.env.local)
```env
NEXT_PUBLIC_API_URL=https://shiplink-q4hu.onrender.com
```

### Mobile App (app.json)
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://shiplink-q4hu.onrender.com/api"
    }
  }
}
```

---

## 📝 Admin Dashboard Deployment (Vercel)

### Step 1: Prepare Repository
1. Ensure all code is pushed to GitHub
2. Verify `admin/` directory exists with all files

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com
2. Sign up/Login (use GitHub account)
3. Click **"New Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `admin`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
6. Add Environment Variable:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://shiplink-q4hu.onrender.com`
7. Click **"Deploy"**

#### Option B: Via Vercel CLI
```bash
cd admin
npm install -g vercel
vercel login
vercel
# Follow prompts:
# - Set root directory: admin
# - Add environment variable: NEXT_PUBLIC_API_URL=https://shiplink-q4hu.onrender.com
```

### Step 3: Post-Deployment
1. Your admin dashboard will be live at: `https://your-project.vercel.app`
2. Access admin login at: `https://your-project.vercel.app/login`
3. Default admin credentials (create via script):
   ```bash
   cd backend
   node scripts/create-admin.js
   ```

---

## 🔄 Backend Deployment (Render)

### Auto-Deploy Setup
1. Go to https://dashboard.render.com
2. Select your backend service
3. Go to **Settings** → **Auto-Deploy**
4. Ensure **"Auto-Deploy"** is enabled
5. Select branch: `master` or `main`

### Manual Deploy
1. Push code to GitHub
2. Render will automatically detect and deploy
3. Or manually trigger from Render dashboard

### Environment Variables (Render)
Set these in Render dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT` (auto-set by Render)

---

## 📱 Mobile App Deployment

### Build APK (Android)
```bash
cd frontend
eas build --platform android --profile preview
```

### Build IPA (iOS)
```bash
cd frontend
eas build --platform ios --profile preview
```

---

## 🧪 Testing Deployment

### Test Backend
```bash
curl https://shiplink-q4hu.onrender.com/health
```

### Test Admin Dashboard
1. Visit your Vercel URL
2. Login with admin credentials
3. Test all features

### Test Mobile App
1. Install APK on device
2. Test login, delivery creation, marketplace

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up CORS properly
- [ ] Use environment variables (never commit secrets)
- [ ] Enable rate limiting (recommended)

---

## 📊 Monitoring

### Backend (Render)
- View logs in Render dashboard
- Monitor uptime and performance
- Set up alerts for downtime

### Admin Dashboard (Vercel)
- View analytics in Vercel dashboard
- Monitor build logs
- Check deployment history

---

## 🐛 Troubleshooting

### Backend Issues
- **Port Error**: Render auto-assigns PORT, use `process.env.PORT`
- **MongoDB Connection**: Verify MONGODB_URI is correct
- **Socket.io**: Ensure CORS is configured

### Admin Dashboard Issues
- **API Connection**: Verify NEXT_PUBLIC_API_URL is set
- **Build Errors**: Check Node.js version (should be 18+)
- **404 Errors**: Verify root directory is set to `admin`

---

## 📞 Support

For issues:
1. Check logs in respective dashboards
2. Verify environment variables
3. Test API endpoints directly
4. Check GitHub for latest code

---

## ✅ Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Admin dashboard deployed on Vercel
- [ ] Environment variables configured
- [ ] Admin user created
- [ ] API endpoints tested
- [ ] Mobile app configured with production API
- [ ] All features tested
- [ ] Security measures in place

---

**Last Updated**: 2025-01-30
**Status**: Production Ready ✅

