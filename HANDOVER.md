# 🤝 ShipLink Project Handover Documentation

## Welcome to the ShipLink Team!

This document provides everything you need to take over and continue development of the ShipLink logistics platform.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Initial Setup](#initial-setup)
4. [Development Workflow](#development-workflow)
5. [Code Structure](#code-structure)
6. [Current Implementation Status](#current-implementation-status)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps & Roadmap](#next-steps--roadmap)

---

## 🎯 Project Overview

### What is ShipLink?

ShipLink is a full-stack logistics platform that connects:

- **Importers** (Customers) who need to import goods and track shipments
- **Drivers** who provide last-mile delivery services
- **Logistics Companies** that handle shipping operations

### Key Features

**For Importers:**

- Find and book logistics companies
- Request driver pickups
- Track shipments in real-time
- Manage orders and delivery history
- Find sourcing agents
- Access marketplace

**For Drivers:**

- View and accept delivery requests
- Update location in real-time
- Track earnings
- Manage delivery status
- View delivery history

### Technology Decisions

**Why Monorepo?**

- Single repository for both frontend and backend
- Easier onboarding (clone once, see everything)
- Unified versioning
- Better for team collaboration

**Why React Native + Expo?**

- Cross-platform (iOS, Android, Web)
- Fast development with hot reload
- Large ecosystem
- Easy deployment

**Why Node.js + Express?**

- JavaScript/TypeScript across the stack
- Fast and scalable
- Large ecosystem
- Easy to learn

---

## 💻 System Requirements

### Required Software

| Software    | Minimum Version | Download Link                                  |
| ----------- | --------------- | ---------------------------------------------- |
| Node.js     | v18.0.0         | https://nodejs.org/                            |
| npm         | v9.0.0          | (comes with Node.js)                           |
| MongoDB     | v6.0.0          | https://www.mongodb.com/try/download/community |
| Git         | v2.30.0         | https://git-scm.com/downloads                  |
| Code Editor | Latest          | VS Code or Cursor recommended                  |

### Optional Tools

- **MongoDB Compass** - GUI for MongoDB (https://www.mongodb.com/products/compass)
- **Postman** - API testing (https://www.postman.com/downloads/)
- **React Native Debugger** - Debugging tool
- **Android Studio** - For Android development
- **Xcode** - For iOS development (Mac only)

---

## 🚀 Initial Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd shiplink-fullstack
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (root, frontend, backend)
npm run install:all
```

This command will:

1. Install root dependencies (concurrently, rimraf)
2. Navigate to frontend and install React Native dependencies
3. Navigate to backend and install Express dependencies

**If you encounter issues, install manually:**

```bash
# Root
npm install

# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..
```

### Step 3: Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server Configuration
PORT=5444
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/shiplink

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-IN-PRODUCTION
JWT_EXPIRES_IN=7d

# Optional: MongoDB Atlas (Cloud Database)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shiplink?retryWrites=true&w=majority
```

**Important:** Never commit the `.env` file to Git! It's already in `.gitignore`.

#### Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:5444` in development mode.

To change the API URL, edit `frontend/src/constants/api.ts`.

### Step 4: Start MongoDB

#### Option A: Local MongoDB

```bash
# Start MongoDB service
mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGO_URI` in `backend/.env`

### Step 5: Verify Setup

```bash
# From root directory
npm run dev
```

You should see:

```
[BACKEND] Server running on http://localhost:5444
[FRONTEND] Metro waiting on exp://192.168.x.x:19000
```

---

## 🛠️ Development Workflow

### Daily Development

#### 1. Start Development Servers

```bash
# From root directory - starts both frontend and backend
npm run dev
```

#### 2. Make Changes

**Frontend:** Navigate to `frontend/app/` and edit screens

- Changes reflect immediately (hot reload)

**Backend:** Navigate to `backend/src/` and edit files

- Server restarts automatically (nodemon)

#### 3. Test Your Changes

**Frontend:**

- Scan QR code with Expo Go app
- Or press `a` for Android emulator
- Or press `i` for iOS simulator
- Or press `w` for web browser

**Backend:**

- Use Postman or Thunder Client to test API endpoints
- Check terminal for logs

### Git Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "Description of changes"

# 3. Push to remote
git push origin feature/your-feature-name

# 4. Create Pull Request on GitHub/GitLab
```

### Running Services Separately

```bash
# Run only frontend
npm run dev:frontend

# Run only backend
npm run dev:backend
```

---

## 📁 Code Structure

### Frontend Structure

```
frontend/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (user)/(tabs)/       # User screens: Home, Orders, Track, Profile
│   ├── (driver)/(tabs)/     # Driver screens: Dashboard, Deliveries, Earnings
│   ├── (onboarding)/        # Onboarding flow
│   ├── _layout.tsx          # Root layout with AuthProvider
│   └── index.tsx            # Entry point with routing logic
│
├── components/              # Reusable UI components
│   ├── LoadingScreen.tsx   # Loading component
│   └── ui/                 # UI components
│
├── src/
│   ├── context/            # React Context
│   │   └── AuthContext.tsx # Authentication state management
│   │
│   ├── services/           # API services (TO BE CREATED)
│   │   └── api.ts         # API service layer
│   │
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # User, Driver, DeliveryRequest types
│   │
│   └── utils/             # Utility functions
│       └── validation.ts  # Form validation schemas (Yup)
│
└── package.json           # Frontend dependencies
```

### Backend Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── db.ts        # MongoDB connection
│   │
│   ├── controllers/     # Business logic
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── driverController.ts
│   │   └── deliveryRequestController.ts
│   │
│   ├── middleware/      # Middleware functions
│   │   ├── auth.ts     # JWT authentication
│   │   └── authorize.ts # Role-based authorization
│   │
│   ├── models/         # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Driver.ts
│   │   └── DeliveryRequest.ts
│   │
│   ├── routes/         # API routes
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── driverRoutes.ts
│   │   └── deliveryRequestRoutes.ts
│   │
│   ├── schemas/        # Input validation
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   │   ├── hash.ts    # Password hashing
│   │   ├── jwt.ts     # JWT generation/verification
│   │   └── location.ts # Distance calculation
│   │
│   └── index.ts        # Entry point
│
└── package.json        # Backend dependencies
```

---

## ✅ Current Implementation Status

### Completed Features

#### Frontend ✅

- ✅ Onboarding flow (Splash, Features, Role Selection)
- ✅ Authentication UI (Login, Register, Forgot Password)
- ✅ User Dashboard
  - ✅ Home with quick actions
  - ✅ Orders management
  - ✅ Shipment tracking
  - ✅ Profile management
- ✅ Driver Dashboard
  - ✅ Dashboard with stats
  - ✅ Available requests
  - ✅ Deliveries management
  - ✅ Earnings tracking
- ✅ Sourcing Agent screen
- ✅ AuthContext with AsyncStorage
- ✅ Type definitions
- ✅ Form validation schemas
- ✅ Navigation (Expo Router)
- ✅ UI components with NativeWind

#### Backend ✅

- ✅ Express server setup
- ✅ MongoDB connection
- ✅ User model and routes
- ✅ Driver model and routes
- ✅ Delivery Request model and routes
- ✅ JWT authentication
- ✅ Role-based authorization (Customer/Driver)
- ✅ Password hashing with bcrypt
- ✅ Location tracking for drivers
- ✅ Nearby driver search
- ✅ Distance and price calculation
- ✅ Driver statistics and earnings

### In Progress 🔨

- 🔨 Frontend-Backend integration (connecting API calls)
- 🔨 API service layer in frontend
- 🔨 Real AuthContext using backend APIs

### To Do 📋

#### High Priority

- 📋 Complete API integration
- 📋 Real-time notifications (Socket.io)
- 📋 Image upload (for profile pictures, delivery proof)
- 📋 Payment integration
- 📋 Push notifications (Expo Notifications)

#### Medium Priority

- 📋 Advanced search and filters
- 📋 In-app messaging/chat
- 📋 Rating and review system
- 📋 Analytics dashboard

#### Low Priority

- 📋 Multi-language support
- 📋 Dark mode
- 📋 Admin panel
- 📋 Advanced reporting

---

## 🔧 Common Tasks

### Adding a New Screen

#### Frontend

1. Create screen file in appropriate route group:

```typescript
// frontend/app/(user)/screens/new-screen.tsx
import { View, Text } from 'react-native';

export default function NewScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <Text className="text-2xl font-bold">New Screen</Text>
    </View>
  );
}
```

2. Navigate to it:

```typescript
import { router } from "expo-router";

// Navigate
router.push("/(user)/screens/new-screen");
```

### Adding a New API Endpoint

#### Backend

1. **Create model** (if needed) in `backend/src/models/`

```typescript
// backend/src/models/Order.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: string[];
  total: number;
  status: string;
}

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [String],
    total: { type: Number, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
```

2. **Create controller** in `backend/src/controllers/`

```typescript
// backend/src/controllers/orderController.ts
import { Request, Response } from "express";
import Order from "../models/Order";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

3. **Create route** in `backend/src/routes/`

```typescript
// backend/src/routes/orderRoutes.ts
import express from "express";
import { createOrder } from "../controllers/orderController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/", authenticate, createOrder);

export default router;
```

4. **Register route** in `backend/src/index.ts`

```typescript
import orderRoutes from "./routes/orderRoutes";

app.use("/api/orders", orderRoutes);
```

### Updating Frontend to Call Backend API

1. **Create API service** in `frontend/src/services/api.ts`

```typescript
const API_URL = "http://localhost:5444/api";

export const createOrder = async (orderData: any) => {
  const token = await AsyncStorage.getItem("authToken");

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  return response.json();
};
```

2. **Use in component**

```typescript
import { createOrder } from "../../../src/services/api";

const handleCreateOrder = async () => {
  try {
    const result = await createOrder({ items: ["item1"], total: 100 });
    console.log("Order created:", result);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"

**Problem:** Backend can't connect to MongoDB

**Solutions:**

```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

#### 2. "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**

```bash
# Clean and reinstall
npm run clean
npm run install:all
```

#### 3. "Port already in use"

**Problem:** Port 5444 is already taken

**Solution:**

```bash
# Find and kill process using port 5444
# Windows:
netstat -ano | findstr :5444
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5444 | xargs kill -9

# Or change port in backend/.env
PORT=5445
```

#### 4. "Expo app not loading"

**Problem:** Frontend won't load in Expo Go

**Solutions:**

1. Make sure you're on the same WiFi network
2. Clear Metro cache:

```bash
cd frontend
npx expo start -c
```

#### 5. "JWT token invalid"

**Problem:** Authentication fails

**Solution:**

- Clear AsyncStorage data
- Re-login
- Check JWT_SECRET matches in backend/.env

### Getting Help

1. Check the error message carefully
2. Search in this documentation
3. Check `backend/README.md` and `frontend/README.md`
4. Contact team leads

---

## 🎯 Next Steps & Roadmap

### Immediate Next Steps (Week 1-2)

1. **Complete API Integration**
   - [ ] Create `frontend/src/services/api.ts`
   - [ ] Update `AuthContext` to use real backend
   - [ ] Connect all screens to backend APIs
   - [ ] Test all user flows

2. **Testing**
   - [ ] Test registration flow
   - [ ] Test login flow
   - [ ] Test creating delivery requests
   - [ ] Test driver accepting requests
   - [ ] Test order tracking

3. **Bug Fixes**
   - [ ] Fix any UI issues
   - [ ] Handle error states
   - [ ] Add loading states
   - [ ] Improve form validation

### Short Term (Month 1)

- [ ] Real-time notifications
- [ ] Image upload for profiles
- [ ] Payment integration (Stripe/PayPal)
- [ ] Push notifications setup
- [ ] Advanced search and filters

### Medium Term (Month 2-3)

- [ ] In-app chat between users and drivers
- [ ] Rating and review system
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Advanced reporting

### Long Term (Month 4+)

- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced analytics
- [ ] Marketing features
- [ ] Referral system
- [ ] Production deployment

---

## 📞 Support & Contacts

### Project Documentation

- **README.md** - Project overview
- **INTEGRATION.md** - API integration guide
- **frontend/README.md** - Frontend documentation
- **backend/README.md** - Backend documentation

### Key Contacts

- **Project Lead**: [Name] - [Email]
- **Backend Lead**: [Name] - [Email]
- **Frontend Lead**: [Name] - [Email]

### Resources

- **Design Files**: [Figma Link]
- **API Documentation**: See INTEGRATION.md
- **Project Management**: [Trello/Jira Link]
- **Communication**: [Slack/Discord Channel]

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All features tested
- [ ] All TODOs resolved
- [ ] Environment variables configured for production
- [ ] Database backup strategy in place
- [ ] Error logging setup (Sentry, LogRocket)
- [ ] Performance optimization done
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

**Welcome to the team! Don't hesitate to ask questions. Good luck! 🚀**
