# Your Next Steps - Action Plan

## 🎯 Goal: Get ShipLink Running End-to-End

Follow these steps in order to get your app fully functional.

---

## Step 1: Set Up the Database (MongoDB Atlas) ⏱️ 10 minutes

### Why First?

The backend needs a database to store data. MongoDB Atlas is free and easy.

### What to Do:

1. **Create MongoDB Atlas Account**

   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free account)

2. **Create a Cluster**

   - Click "Create" or "Build a Database"
   - Choose **FREE** tier (M0 Sandbox)
   - Select a cloud provider and region (closest to you)
   - Click "Create"

3. **Set Up Database Access**

   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `shiplink-admin` (or any name)
   - Password: Create a strong password (save it!)
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

4. **Set Up Network Access**

   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - **Replace `<password>` with your actual password**
   - **Add database name**: Change `?retryWrites...` to `/shiplink?retryWrites...`
   - Final string: `mongodb+srv://username:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shiplink?retryWrites=true&w=majority`
   - **Save this string!** You'll need it in Step 2

---

## Step 2: Set Up the Backend ⏱️ 15 minutes

### What to Do:

1. **Navigate to Backend Folder**

   ```bash
   cd backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   This installs all required packages (Express, MongoDB, JWT, etc.)

3. **Create Environment File**

   - Copy the example file:

     ```bash
     # Windows PowerShell
     Copy-Item env.example .env

     # Or manually create .env file
     ```

   - Open `.env` file in a text editor

4. **Configure Environment Variables**
   Edit `.env` with your values:

   ```env
   PORT=5444
   NODE_ENV=development

   # Paste your MongoDB connection string from Step 1
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shiplink?retryWrites=true&w=majority

   # Generate a random secret (use any long random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
   JWT_EXPIRE=7d
   ```

5. **Generate JWT Secret** (Important!)

   - Go to: https://randomkeygen.com/
   - Copy a "CodeIgniter Encryption Keys" value
   - Paste it as `JWT_SECRET` in `.env`

6. **Test Backend Connection**

   ```bash
   npm run dev
   ```

   You should see:

   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 5444
   📡 API available at http://localhost:5444/api
   🏥 Health check: http://localhost:5444/health
   ```

7. **Test Health Endpoint**

   - Open browser: http://localhost:5444/health
   - Should see: `{"status":"OK","message":"ShipLink API is running",...}`
   - ✅ Backend is working!

8. **Keep Backend Running**
   - Leave this terminal window open
   - Backend must stay running for frontend to work

---

## Step 3: Update Frontend to Use Your Backend ⏱️ 5 minutes

### What to Do:

1. **Check Current API URL**

   - Open: `frontend/src/services/api.ts`
   - Look for the API_BASE_URL configuration

2. **For Local Development**

   - If testing locally, the frontend should already point to `http://localhost:5444/api`
   - If using a physical device, you'll need your computer's IP address
   - Find your IP:
     - Windows: Open Command Prompt → `ipconfig` → Look for "IPv4 Address"
     - Mac/Linux: Open Terminal → `ifconfig` → Look for "inet"
   - Update API URL to: `http://YOUR_IP_ADDRESS:5444/api`
   - Example: `http://192.168.1.100:5444/api`

3. **For Production (Later)**
   - After deploying backend to Render, update to: `https://your-app.onrender.com/api`

---

## Step 4: Test the Complete System ⏱️ 20 minutes

### What to Do:

1. **Start Frontend**

   - Open a NEW terminal window
   - Navigate to frontend:
     ```bash
     cd frontend
     ```
   - Start Expo:
     ```bash
     npm start
     ```
   - Scan QR code with Expo Go app (iOS/Android) or press `i` for iOS simulator / `a` for Android

2. **Test Registration**

   - Open app → Tap "Sign Up"
   - Fill in:
     - Name: "Test User"
     - Email: "test@example.com"
     - Phone: "1234567890"
     - Password: "password123"
     - Role: Select "Importer" (customer)
   - Tap "Sign up"
   - ✅ Should see success and redirect to home

3. **Test Login**

   - Logout (if logged in)
   - Login with: test@example.com / password123
   - ✅ Should login successfully

4. **Test Delivery Creation**

   - Tap "Request Driver" or "Create Delivery"
   - Fill in package details
   - Enter pickup and dropoff addresses
   - Tap "Submit"
   - ✅ Should see price and time calculated
   - ✅ Should see success message

5. **Test as Driver**
   - Logout
   - Register a new account with "Driver" role
   - Login as driver
   - ✅ Should see driver dashboard
   - ✅ Should see pending requests (if any)

---

## Step 5: Deploy Backend to Production (Render) ⏱️ 30 minutes

### Why Deploy?

So your app works from anywhere, not just your local network.

### What to Do:

1. **Push Code to GitHub**

   - Create a new repository on GitHub
   - Push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/yourusername/shiplink-backend.git
     git push -u origin main
     ```

2. **Create Render Account**

   - Go to: https://render.com
   - Sign up (free with GitHub)

3. **Create New Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `shiplink-fullstack` repository
   - Choose the `backend` folder

4. **Configure Service**

   - **Name**: `shiplink-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend` (if option available)

5. **Set Environment Variables**

   - Scroll to "Environment Variables"
   - Add:
     - `MONGODB_URI` = Your MongoDB Atlas connection string
     - `JWT_SECRET` = Your JWT secret from Step 2
     - `NODE_ENV` = `production`
     - `PORT` = Leave empty (Render sets this)

6. **Deploy**

   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - ✅ You'll get a URL like: `https://shiplink-backend.onrender.com`

7. **Test Production Backend**
   - Visit: `https://your-app.onrender.com/health`
   - ✅ Should see health check response

---

## Step 6: Update Frontend for Production ⏱️ 5 minutes

### What to Do:

1. **Update API URL**

   - Open: `frontend/src/services/api.ts`
   - Update `PRODUCTION_API_URL` to your Render URL:
     ```typescript
     const PRODUCTION_API_URL = "https://your-app.onrender.com/api";
     ```

2. **Test with Production Backend**
   - Restart frontend: `npm start`
   - Test registration/login
   - ✅ Should work with production backend

---

## Step 7: Build Frontend for Production ⏱️ 20 minutes

### Option A: Expo Build (Easiest)

1. **Install EAS CLI**

   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**

   ```bash
   cd frontend
   eas build:configure
   ```

3. **Build for Android**

   ```bash
   eas build --platform android
   ```

4. **Build for iOS** (requires Apple Developer account)

   ```bash
   eas build --platform ios
   ```

5. **Download and Install**
   - EAS will provide download links
   - Install on your device for testing

### Option B: Local Build (Advanced)

1. **Build Android APK**

   ```bash
   cd frontend
   npx expo build:android
   ```

2. **Install on Device**
   - Transfer APK to Android device
   - Install and test

---

## Step 8: Final Testing Checklist ✅

Test everything before going live:

### Authentication

- [ ] Can register as customer
- [ ] Can register as driver
- [ ] Can login
- [ ] Can logout
- [ ] Token persists after app restart

### User Features

- [ ] Can view profile
- [ ] Can create delivery request
- [ ] Price calculates correctly
- [ ] Distance calculates correctly
- [ ] Can view "My Orders"
- [ ] Can see delivery status
- [ ] Can cancel pending delivery

### Driver Features

- [ ] Can create driver profile
- [ ] Can toggle availability
- [ ] Can see pending requests
- [ ] Can accept request
- [ ] Can update delivery status
- [ ] Can view "My Deliveries"
- [ ] Can view statistics

### Error Handling

- [ ] Shows errors for invalid login
- [ ] Shows errors for network issues
- [ ] Shows errors for validation failures

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to API"

**Solution**:

- Check backend is running: `npm run dev` in backend folder
- Check API URL in frontend matches backend URL
- For physical device: Use computer's IP address, not localhost
- Check firewall allows connections on port 5444

### Issue: "MongoDB connection error"

**Solution**:

- Verify connection string in `.env`
- Check MongoDB Atlas network access allows your IP
- Verify username/password are correct
- Check database name is included in connection string

### Issue: "JWT token error"

**Solution**:

- Make sure `JWT_SECRET` is set in `.env`
- Restart backend after changing `.env`
- Clear app data and login again

### Issue: "Port already in use"

**Solution**:

- Change `PORT` in `.env` to another number (e.g., 5445)
- Or kill the process using port 5444

---

## 📋 Quick Command Reference

### Backend Commands

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm start            # Start production server
```

### Frontend Commands

```bash
cd frontend
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
```

### Database

- MongoDB Atlas Dashboard: https://cloud.mongodb.com
- Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/shiplink`

---

## 🎯 Priority Order

**Do these first (MVP):**

1. ✅ Set up MongoDB Atlas
2. ✅ Set up backend locally
3. ✅ Test registration/login
4. ✅ Test delivery creation
5. ✅ Deploy backend to Render

**Do these next (Production):** 6. ✅ Update frontend API URL 7. ✅ Build frontend app 8. ✅ Test on real device 9. ✅ Submit to app stores (optional)

---

## 💡 Pro Tips

1. **Keep Backend Running**: Always have backend running when testing frontend
2. **Check Logs**: Backend terminal shows all requests and errors
3. **Test Incrementally**: Test one feature at a time
4. **Save Credentials**: Keep MongoDB connection string and JWT secret safe
5. **Use Environment Variables**: Never commit `.env` to GitHub

---

## 🆘 Need Help?

If you get stuck:

1. Check the error message in the terminal
2. Check `HOW_EVERYTHING_WORKS.md` for explanations
3. Verify all environment variables are set
4. Make sure all dependencies are installed
5. Restart both backend and frontend

---

## ✅ Success Criteria

You're ready when:

- ✅ Backend runs without errors
- ✅ Frontend connects to backend
- ✅ Can register and login
- ✅ Can create delivery requests
- ✅ Can accept requests as driver
- ✅ Data saves to MongoDB Atlas
- ✅ Everything works on a real device

**You've got this! Start with Step 1 and work through each step. Take your time and test as you go!** 🚀
