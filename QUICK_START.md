# ShipLink Quick Start Guide

This guide will help you test the integrated frontend-backend system.

---

## Prerequisites

- Node.js (v16+)
- MongoDB installed and running
- Expo CLI or Expo Go app on your phone
- Git

---

## Step 1: Start MongoDB

**Windows:**

```bash
net start MongoDB
```

**Mac/Linux:**

```bash
mongod --config /usr/local/etc/mongod.conf
```

**Or use MongoDB Atlas (Cloud):**

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGO_URI` in `backend/.env`

---

## Step 2: Configure Backend Environment

Create `backend/.env` file (if it doesn't exist):

```env
PORT=5444
MONGO_URI=mongodb://localhost:27017/shiplink
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Step 3: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see:

```
shiplink server running on http://localhost:5444
mongodb active
```

Test the server:

```bash
curl http://localhost:5444/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-27T..."
}
```

---

## Step 4: Start Frontend

**In a new terminal:**

```bash
cd frontend
npm install
npx expo start
```

You'll see a QR code. You can:

- Press `w` to open in web browser
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Scan QR with Expo Go app on your phone

---

## Step 5: Test the Integration

### A. Test Customer Flow

1. **Register as Customer:**

   - Open the app
   - Click "Sign Up"
   - Enter details:
     - Name: John Doe
     - Email: john@example.com
     - Phone: +1234567890
     - Password: password123
     - (Role: Customer is default)
   - Click "Sign up"

2. **You should:**

   - Be automatically logged in
   - See the Customer home screen
   - See "Welcome back, John!" at the top

3. **View Orders:**

   - Navigate to "Orders" tab
   - Should see "No orders found" (database is empty)
   - This is correct - no deliveries created yet

4. **View Profile:**
   - Navigate to "Profile" tab
   - Should see your name, email, and phone
   - These come from the backend!

### B. Test Driver Flow

1. **Logout:**

   - Go to Profile
   - Click "Logout"

2. **Register as Driver:**

   - Click "Sign Up"
   - Enter details:
     - Name: Jane Driver
     - Email: jane@example.com
     - Phone: +0987654321
     - Password: password123
   - Before clicking signup, you'll need to set role to driver in onboarding

3. **Alternative - Login directly:**

   - If role selection isn't available, use the login screen
   - Select "Driver" role toggle
   - Login with driver credentials

4. **Driver Dashboard:**

   - Should see "Welcome back, Jane!"
   - "Available Requests" count shows 0
   - Status shows "Online"

5. **View Deliveries:**
   - Navigate to "Deliveries" tab
   - Should see "No deliveries yet"
   - This is correct - driver hasn't accepted any requests

---

## Step 6: Create Test Data (via Backend API)

Since the UI for creating delivery requests isn't built yet, use this script or Postman:

### Using cURL:

**1. Register and get token:**

```bash
curl -X POST http://localhost:5444/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "phone": "+1111111111",
    "password": "password123",
    "role": "customer"
  }'
```

Copy the `token` from the response.

**2. Create a delivery request:**

```bash
curl -X POST http://localhost:5444/api/delivery-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "pickupLocation": {
      "address": "123 Main St, New York, NY",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "dropoffLocation": {
      "address": "456 Park Ave, New York, NY",
      "latitude": 40.7614,
      "longitude": -73.9776
    },
    "packageDetails": {
      "weight": 5,
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      },
      "contentDescription": "Electronics Package"
    }
  }'
```

**3. Refresh the app:**

- Customer: Go to "Orders" tab - you should see the delivery!
- Driver: Go to "Dashboard" - you should see it in "Available Requests"!

---

## Step 7: Test Driver Accepting Request

1. **As Driver:**

   - View the pending request on dashboard
   - Click "Accept" button
   - Should see "Request accepted successfully!"

2. **Check Deliveries:**

   - Navigate to "Deliveries" tab
   - The accepted delivery should now appear here
   - Status will be "Accepted"

3. **As Customer:**
   - Go to "Orders" tab
   - The delivery status should have changed from "Pending" to "Accepted"

---

## Common Issues & Solutions

### Issue: "Network request failed"

**Solution:**

- Make sure backend is running on port 5444
- Check `frontend/src/services/api.ts` has correct `API_BASE_URL`
- If using physical device, use your computer's IP instead of localhost:
  ```typescript
  const API_BASE_URL = __DEV__
    ? "http://192.168.1.X:5444/api" // Replace X with your IP
    : "https://api.shiplink.com/api";
  ```

### Issue: "Invalid email or password"

**Solution:**

- Make sure you registered the user first
- Password must be at least 6 characters
- Email must be unique

### Issue: "Unauthorized"

**Solution:**

- Token might have expired (after 7 days)
- Try logging out and logging back in
- Check that token is being sent in Authorization header

### Issue: MongoDB connection error

**Solution:**

- Verify MongoDB is running: `mongosh` or `mongo`
- Check connection string in `backend/.env`
- Make sure port 27017 is not blocked

### Issue: "User with this email already exists"

**Solution:**

- Email is already registered
- Use a different email
- Or login with existing credentials

---

## Useful Commands

### Backend

```bash
# Start in dev mode with auto-reload
npm run dev

# Check backend logs
# Look at terminal where backend is running

# Test health endpoint
curl http://localhost:5444/health
```

### Frontend

```bash
# Start Expo
npx expo start

# Clear cache
npx expo start -c

# Run on specific platform
npx expo start --web
npx expo start --android
npx expo start --ios
```

### MongoDB

```bash
# Connect to database
mongosh

# In mongo shell, view collections
use shiplink
show collections

# View users
db.users.find().pretty()

# View delivery requests
db.deliveryrequests.find().pretty()

# Clear all data (reset database)
db.users.deleteMany({})
db.deliveryrequests.deleteMany({})
```

---

## API Testing with Postman

### Import these requests:

**1. Register:**

- **POST** `http://localhost:5444/api/auth/register`
- **Body (JSON):**

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "customer"
}
```

**2. Login:**

- **POST** `http://localhost:5444/api/auth/login`
- **Body (JSON):**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**3. Get My Profile:**

- **GET** `http://localhost:5444/api/users/me`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

**4. Create Delivery:**

- **POST** `http://localhost:5444/api/delivery-requests`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**

```json
{
  "pickupLocation": {
    "address": "Downtown Office, 123 Business St",
    "latitude": 40.7128,
    "longitude": -74.006
  },
  "dropoffLocation": {
    "address": "Residential Area, 456 Home Ave",
    "latitude": 40.7489,
    "longitude": -73.968
  },
  "packageDetails": {
    "weight": 2.5,
    "dimensions": {
      "length": 20,
      "width": 15,
      "height": 10
    },
    "contentDescription": "Documents and office supplies"
  }
}
```

**5. Get My Requests (Customer):**

- **GET** `http://localhost:5444/api/delivery-requests/user/my-requests`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

**6. Get Pending Requests (Driver):**

- **GET** `http://localhost:5444/api/delivery-requests/pending`

**7. Accept Request (Driver):**

- **POST** `http://localhost:5444/api/delivery-requests/:requestId/accept`
- **Headers:**
  - `Authorization: Bearer YOUR_DRIVER_TOKEN`

---

## Video Demo Script

**Want to show this working? Follow this flow:**

1. Start backend and frontend
2. Open Expo in browser
3. Register as customer (show the form)
4. Navigate to Orders (show empty state)
5. Switch to Postman → Create a delivery request
6. Refresh Orders → Show the delivery appears!
7. Logout
8. Register as driver
9. View Dashboard → Show pending request
10. Click Accept
11. View Deliveries → Show accepted delivery
12. Switch back to customer account
13. View Orders → Show status changed to "Accepted"

---

## Next Steps

Now that you've confirmed the integration works:

1. ✅ You can create delivery requests via API
2. ✅ Customers can view their requests
3. ✅ Drivers can see and accept requests
4. ✅ Real-time updates work

**Build these features next:**

- Customer UI to create delivery requests
- Driver UI to update delivery status
- Real-time location tracking
- Payment integration

---

## Need Help?

Check these files:

- `INTEGRATION_STATUS.md` - Full integration details
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend setup guide

**Happy coding!** 🚀
