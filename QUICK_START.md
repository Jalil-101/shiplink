# 🚀 Quick Start Guide - Get ShipLink Running NOW

## ✅ Step 1: Your MongoDB is Ready!

Your connection string has been configured. The `.env` file is set up with:
- ✅ MongoDB Atlas connection
- ✅ JWT secret (change this later!)
- ✅ All required settings

## 🎯 Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs all required packages (Express, MongoDB, JWT, etc.)

## 🚀 Step 3: Start the Backend

```bash
npm run dev
```

**You should see:**
```
✅ Connected to MongoDB
🚀 Server running on port 5444
📡 API available at http://localhost:5444/api
🏥 Health check: http://localhost:5444/health
```

**✅ Keep this terminal open!** The backend must stay running.

## 📱 Step 4: Start the Frontend

**Open a NEW terminal window:**

```bash
cd frontend
npm start
```

- Scan QR code with **Expo Go** app (iOS/Android)
- Or press `i` for iOS simulator / `a` for Android emulator

## 🧪 Step 5: Test Everything

### Test 1: Health Check
- Open browser: http://localhost:5444/health
- Should see: `{"status":"OK",...}`

### Test 2: Register a User
1. In the app, tap "Sign Up"
2. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "1234567890"
   - Password: "password123"
   - Role: "Importer" (customer)
3. Tap "Sign up"
4. ✅ Should see success and redirect to home

### Test 3: Login
1. Logout (if logged in)
2. Login with: `test@example.com` / `password123`
3. ✅ Should login successfully

### Test 4: Create Delivery
1. Tap "Request Driver" or "Create Delivery"
2. Fill in package details
3. Enter addresses
4. Tap "Submit"
5. ✅ Should see calculated price and time

### Test 5: Test as Driver
1. Logout
2. Register new account with "Driver" role
3. Login as driver
4. ✅ Should see driver dashboard
5. ✅ Should see pending requests (if any exist)

## 🎉 Success!

If all tests pass, **your ShipLink app is fully functional!**

---

## 🔧 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Verify MongoDB Atlas allows your IP (Network Access)
- Check if port 5444 is available

### Frontend can't connect
- Make sure backend is running
- Check API URL in `frontend/src/services/api.ts`
- For physical device: Use your computer's IP, not localhost

### Registration/Login fails
- Check backend terminal for error messages
- Verify MongoDB connection is working
- Check `.env` file has correct values

---

## 📝 Your MongoDB Connection

**Connection String:**
```
mongodb+srv://abdulmahama30_db_user:Ridwan2106@shiplink.c85onnm.mongodb.net/shiplink
```

**Database Name:** `shiplink`

**Status:** ✅ Configured and ready

---

## 🎯 What's Next?

Once everything is working locally:

1. **Deploy Backend to Render** (so it works from anywhere)
2. **Update Frontend** to use production backend
3. **Build Frontend App** for Android/iOS
4. **Test on Real Device**

See `NEXT_STEPS.md` for detailed deployment instructions.

---

## 💡 Quick Tips

- ✅ Always keep backend running when testing frontend
- ✅ Check backend terminal for error messages
- ✅ Test one feature at a time
- ✅ Save your MongoDB connection string safely

**You're ready to go! Start with Step 2 above!** 🚀

