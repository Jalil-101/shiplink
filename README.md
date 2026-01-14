# 🚀 ShipLink - Fullstack Logistics & Marketplace Platform

**ShipLink** is a comprehensive delivery and marketplace platform combining logistics services with an integrated e-commerce marketplace. Built with modern technologies and real-time capabilities, tailored for the Ghanaian market with GHS (Ghanaian Cedis) currency support.

## 📊 Current Status: **PRODUCTION READY** ✅

- ✅ Backend deployed: `https://shiplink-q4hu.onrender.com`
- ✅ All core features implemented
- ✅ Admin dashboard deployed on Vercel
- ✅ Logistics company dashboard deployed on Vercel
- ✅ Mobile app ready for build
- ✅ Real-time updates working
- ✅ Marketplace fully functional
- ✅ Multi-role system (User, Driver, Seller, Logistics Company, Sourcing Agent, Import Coach, Admin)
- ✅ Unified Order System with commission calculation
- ✅ Currency: GHS (Ghanaian Cedis) throughout

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Project Overview

This repository contains the **entire ShipLink platform**:

- **Mobile App** (`frontend/`) – React Native / Expo app for users, drivers, sellers, logistics companies, sourcing agents, and import coaches
- **Backend API** (`backend/`) – Node.js / Express / MongoDB API with Socket.io, deterministic order IDs, and notification system
- **Admin Dashboard** (`admin/`) – Next.js admin console for operations, verification, content, and analytics
- **Logistics Dashboard** (`admin/app/logistics-dashboard/`) – Next.js dashboard for logistics companies to manage orders, drivers, and operations

---

## 🛠️ Tech Stack

### Mobile App (Frontend)
- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: React Context API
- **Forms**: React Hook Form + Yup validation
- **Storage**: expo-secure-store (tokens), AsyncStorage (non-sensitive)
- **Icons**: Lucide React Native
- **Maps**: React Native Maps
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Security**: bcryptjs (password hashing), rate limiting

### Admin Dashboard
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Tables**: TanStack Table
- **Data Fetching**: TanStack Query
- **HTTP Client**: Axios

### Logistics Dashboard
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Currency**: GHS (Ghanaian Cedis) formatting

---

## ✨ Features

### 🔐 Authentication & User Management
- Multi-role registration (User, Driver, Seller, Logistics Company, Sourcing Agent, Import Coach)
- JWT-based authentication with secure token storage
- Profile management with image upload
- Password hashing and secure storage
- User suspension/activation (admin)
- Role application and verification system
- Onboarding flow for new users

### 🚚 Delivery System
- Create delivery requests with package details
- Automatic price calculation (distance + weight) in GHS
- Unified Order System supporting multiple order types
- Driver assignment and tracking (first-come-first-serve)
- Real-time status updates via Socket.io
- Delivery history and tracking
- Commission calculation (15% for delivery orders)
- Provider payout calculation
- Dispute resolution (admin)
- Return delivery management

### 👨‍✈️ Driver Features
- Driver profile creation with ID verification
- Vehicle information management
- Availability toggle
- Location tracking
- Earnings dashboard (shows provider_payout)
- View and accept available delivery requests
- Real-time order updates
- Delivery status management

### 🛒 Marketplace
- Product catalog with categories
- Shopping cart with real-time sync
- Order management with delivery options
- Optional delivery integration
- Admin product management
- Stock tracking with real-time updates
- Free delivery promotions
- Product reviews and ratings

### 🏢 Logistics Company Features
- Company profile management
- Order management dashboard
- Driver assignment
- Order scheduling (pickup/delivery)
- Financial tracking (gross_amount, commission, provider_payout)
- Invoice generation
- Quote management
- Return management
- Analytics and reporting

### 👨‍💼 Admin Dashboard
- **User Management**: View, suspend, force logout, activity history
- **Driver Verification**: Approve/reject, request re-upload, suspend
- **Logistics Company Management**: View, verify, manage companies
- **Delivery Oversight**: View, filter, reassign, resolve disputes
- **Product Management**: CRUD, categories, images (max 3), stock
- **Order Management**: View, filter, update status (unified orders)
- **Content Management**: Announcements, banners, FAQ
- **Analytics**: Overview, user/driver/delivery analytics
- **Financial**: Payouts, earnings tracking (GHS currency)
- **Settings**: Free delivery toggle, pricing configuration
- **System Health**: Monitoring, audit logs

### 🔔 Real-time Features (Socket.io)
- Product stock updates
- Cart synchronization
- Order status updates
- Settings changes
- Driver availability
- Notification badge counts
- Order creation notifications

### 💰 Pricing & Commission System
- **Currency**: GHS (Ghanaian Cedis) throughout
- **Commission Rates**:
  - Delivery orders: 15%
  - Marketplace orders: 10%
  - Sourcing orders: 5%
  - Coaching orders: 10%
- **Pricing Display**:
  - Users see: `gross_amount` (what they pay)
  - Providers see: `provider_payout` (what they earn after commission)
- **Consistency**: All amounts displayed in GHS (₵) across all dashboards

---

## 📁 Project Structure

```
shiplink-fullstack/
├── frontend/                    # React Native mobile app
│   ├── app/                     # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout with providers
│   │   ├── index.tsx           # Entry point with redirect logic
│   │   ├── (onboarding)/       # Onboarding flow
│   │   │   ├── splash.tsx     # Splash screen (uses splash-icon.png)
│   │   │   ├── features.tsx
│   │   │   └── role-selection.tsx
│   │   ├── (auth)/             # Authentication screens
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (user)/             # User role screens
│   │   │   ├── (tabs)/         # User tab screens
│   │   │   │   ├── home.tsx
│   │   │   │   ├── track.tsx
│   │   │   │   ├── orders.tsx
│   │   │   │   └── profile.tsx
│   │   │   └── [various screens]
│   │   └── (driver)/           # Driver role screens
│   │       ├── (tabs)/         # Driver tab screens
│   │       │   ├── dashboard.tsx
│   │       │   ├── deliveries.tsx
│   │       │   ├── maps.tsx
│   │       │   └── earnings.tsx
│   │       └── [various screens]
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── CurrencyContext.tsx
│   │   ├── services/           # API service layer
│   │   │   └── api.ts          # Centralized API client
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── storage.ts
│   │   │   ├── validation.ts
│   │   │   └── currency.ts
│   │   └── constants/
│   ├── assets/
│   │   └── images/
│   │       ├── splash-icon.png      # App icon & splash screen
│   │       ├── android-icon-foreground.png
│   │       ├── android-icon-background.png
│   │       └── android-icon-monochrome.png
│   ├── app.json                # Expo configuration
│   └── package.json
│
├── backend/                     # Node.js API server
│   ├── server.js               # Main server with Socket.io
│   ├── socket.js               # Socket.io setup
│   ├── controllers/            # Business logic
│   │   ├── order.controller.js
│   │   ├── auth.controller.js
│   │   ├── driver.controller.js
│   │   ├── admin.controller.js
│   │   └── [more controllers]
│   ├── models/                 # Mongoose models
│   │   ├── Order.model.js
│   │   ├── User.model.js
│   │   ├── Driver.model.js
│   │   └── [more models]
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, validation, error handling
│   ├── utils/                  # Utilities
│   │   ├── commissionCalculator.js
│   │   ├── distance.js
│   │   └── idGenerator.js
│   └── package.json
│
├── admin/                       # Next.js admin dashboard
│   ├── app/
│   │   ├── dashboard/          # Admin pages
│   │   │   ├── users/
│   │   │   ├── drivers/
│   │   │   ├── orders/
│   │   │   ├── analytics/
│   │   │   └── [more pages]
│   │   ├── logistics-dashboard/ # Logistics company dashboard
│   │   │   ├── orders/
│   │   │   ├── drivers/
│   │   │   ├── billing/
│   │   │   └── [more pages]
│   │   ├── login/
│   │   └── logistics-login/
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Auth utilities
│   │   └── currency.ts         # GHS formatting
│   └── package.json
│
└── README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **MongoDB** (local or Atlas) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Expo CLI** (optional): `npm install -g expo-cli`
- **EAS CLI** (for builds): `npm install -g eas-cli`

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd shiplink-fullstack
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Install admin dashboard dependencies**
```bash
cd ../admin
npm install
```

### Configuration

#### Backend Configuration

1. **Create `.env` file in `backend/` directory:**
```env
PORT=5444
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shiplink
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shiplink

JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Paystack (optional)
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. **Start the backend server:**
```bash
cd backend
npm run dev    # Development mode with auto-reload
# OR
npm start      # Production mode
```

#### Frontend Configuration

1. **Create `.env` file in `frontend/` directory:**
```env
# Production API URL
EXPO_PUBLIC_API_BASE_URL=https://shiplink-q4hu.onrender.com/api

# OR for local development:
# EXPO_PUBLIC_API_BASE_URL=http://localhost:5444/api

# OR for physical device testing (use your computer's IP):
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5444/api
```

2. **Start the development server:**
```bash
cd frontend
npm start
```

3. **Run on device/emulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

#### Admin Dashboard Configuration

1. **Create `.env.local` file in `admin/` directory:**
```env
NEXT_PUBLIC_API_URL=https://shiplink-q4hu.onrender.com
# OR for local development:
# NEXT_PUBLIC_API_URL=http://localhost:5444
```

2. **Start the development server:**
```bash
cd admin
npm run dev
```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser

---

## 💻 Development

### Running All Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Admin Dashboard
cd admin
npm run dev
```

### Development Mode Authentication

The app includes **mock authentication** for development mode:
- **Any email/password** will work in development mode
- Email containing "driver" → logs in as driver role
- Any other email → logs in as user role
- Mock authentication is automatically disabled in production builds

### Project Scripts

#### Backend
```bash
npm run dev      # Development mode with nodemon
npm start        # Production mode
npm test         # Run tests (if configured)
```

#### Frontend
```bash
npm start        # Start Expo dev server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run on web
npm run lint     # Run ESLint
```

#### Admin Dashboard
```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Run ESLint
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`.env`)
- `PORT` - Server port (default: 5444)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration (default: 7d)
- `PAYSTACK_SECRET_KEY` - Paystack secret key (optional)
- `PAYSTACK_PUBLIC_KEY` - Paystack public key (optional)

#### Frontend (`.env`)
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL

#### Admin Dashboard (`.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL

### App Icon & Splash Screen

The app icon and splash screen use the same image for consistency:
- **Icon**: `frontend/assets/images/splash-icon.png`
- **Splash Screen**: `frontend/assets/images/splash-icon.png`
- **Android Adaptive Icon**: Uses separate foreground/background images
- **Configuration**: `frontend/app.json`

---

## 🏗️ Architecture

### State Management

- **AuthContext**: Manages authentication state, user data, and login/logout
- **ThemeContext**: Manages dark/light mode preference
- **CurrencyContext**: Manages currency (GHS) and formatting
- **React Context API**: For global state management
- **Local State**: React hooks (`useState`, `useReducer`) for component-level state

### API Service

**Location**: `frontend/src/services/api.ts`

**Features:**
- Centralized API client for all backend communication
- Automatic authentication token management
- Request retry logic with exponential backoff
- Comprehensive error handling
- Network error detection and user-friendly messages
- Type-safe request/response handling
- Rate limit error handling

**Key Methods:**
- `login()` - User/driver authentication
- `register()` - User/driver registration
- `createOrder()` - Create unified order (delivery, marketplace, sourcing, coaching)
- `getAvailableOrdersForDrivers()` - Get available delivery orders
- `acceptOrder()` - Accept order (driver)
- `updateOrderStatus()` - Update order status
- `getUserOrders()` - Get user orders
- `getMyDeliveries()` - Get driver deliveries
- And more...

### Navigation

**File-based routing** with Expo Router:
- Routes are defined by file structure in `app/` directory
- Protected routes based on authentication status
- Role-based navigation (User/Driver tabs)
- Safe navigation helper for back button handling

**Navigation Flow:**
1. App starts → `index.tsx` checks auth state
2. Not authenticated → redirects to `(auth)/login`
3. Authenticated → redirects based on role:
   - `user` → `(user)/(tabs)/home`
   - `driver` → `(driver)/(tabs)/dashboard`

### Storage

**Secure Storage** (`expo-secure-store`):
- Authentication tokens
- Sensitive user data

**Regular Storage** (`AsyncStorage`):
- User profile data
- Onboarding completion status
- Theme preference

### Error Handling

- **ErrorBoundary**: Catches React errors and displays fallback UI
- **API Error Handling**: Comprehensive error handling in API service
- **Logger**: Centralized logging with different log levels
- **User-friendly Messages**: Clear error messages for network issues

---

## 🔌 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Order Endpoints (Unified)

- `POST /api/orders` - Create order (delivery, marketplace, sourcing, coaching)
- `GET /api/orders` - Get orders (with filters: `available=true`, `order_type`, `status`)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Driver Endpoints

- `GET /api/orders?available=true&order_type=delivery` - Get available delivery orders
- `PATCH /api/orders/:id/status` (status: `provider_assigned`) - Accept order
- `GET /api/drivers/me/profile` - Get driver profile
- `PATCH /api/drivers/:id/availability` - Toggle availability

### User Endpoints

- `GET /api/orders` - Get user orders
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Admin Endpoints

- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - Get all users
- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/logistics-companies` - Get all logistics companies
- `PATCH /api/admin/drivers/:id/verify` - Verify driver
- `PATCH /api/admin/users/:id/suspend` - Suspend user

### Logistics Company Endpoints

- `POST /api/logistics-companies/login` - Logistics company login
- `GET /api/logistics-companies/dashboard/orders` - Get company orders
- `GET /api/logistics-companies/dashboard/drivers` - Get available drivers
- `POST /api/logistics-companies/dashboard/orders/:id/assign-driver` - Assign driver
- `GET /api/logistics-companies/dashboard/overview` - Get dashboard overview

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🚢 Deployment

### Backend Deployment (Render)

1. **Connect GitHub repository to Render**
2. **Set environment variables:**
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE`
   - `PAYSTACK_SECRET_KEY` (optional)
   - `PAYSTACK_PUBLIC_KEY` (optional)

3. **Deploy**: Auto-deploy from GitHub enabled
4. **Health Check**: `GET /health`

**Deployed URL**: `https://shiplink-q4hu.onrender.com`

### Admin Dashboard Deployment (Vercel)

1. **Connect GitHub repository to Vercel**
2. **Set root directory**: `admin`
3. **Set build command**: `npm run build`
4. **Set environment variable:**
   - `NEXT_PUBLIC_API_URL=https://shiplink-q4hu.onrender.com`

5. **Deploy**: Auto-deploy from GitHub enabled

### Logistics Dashboard Deployment (Vercel)

Same as Admin Dashboard, but routes are under `/logistics-dashboard/*`

### Mobile App Deployment (EAS Build)

#### Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: `npm install -g eas-cli`
3. **Login**: `eas login`

#### Build Configuration

1. **Configure `frontend/eas.json`** (if not exists):
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

2. **Set production API URL in `.env`:**
```env
EXPO_PUBLIC_API_BASE_URL=https://shiplink-q4hu.onrender.com/api
```

3. **Build for Android:**
```bash
cd frontend
eas build --platform android --profile production
```

4. **Build for iOS:**
```bash
cd frontend
eas build --platform ios --profile production
```

#### App Icon & Splash Screen

The app icon and splash screen are configured in `frontend/app.json`:
- **Icon**: `./assets/images/splash-icon.png` (1024x1024px recommended)
- **Splash Screen**: Uses the same `splash-icon.png`
- **Android Adaptive Icon**: Configured with foreground/background images

**Important**: Ensure `splash-icon.png` matches your brand logo. The same image is used for:
- App icon (when installed)
- Splash screen (on app launch)
- Android adaptive icon foreground

---

## 🔐 Default Admin Access

### Create Admin User

```bash
cd backend
node scripts/create-admin.js
```

**Default credentials** (change after first login):
- Email: `admin@shiplink.com`
- Password: `admin123`

**⚠️ Change the password after first login!**

---

## 💰 Pricing & Commission System

### Commission Rates

- **Delivery Orders**: 15% commission
- **Marketplace Orders**: 10% commission (can be overridden by seller)
- **Sourcing Orders**: 5% commission (can be overridden by agent)
- **Coaching Orders**: 10% commission (can be overridden by coach)

### Pricing Display

- **Users see**: `gross_amount` (what they pay in GHS)
- **Providers see**: `provider_payout` (what they earn after commission in GHS)
- **Currency**: All amounts displayed in GHS (₵) throughout the platform

### Commission Calculation

```javascript
commission_amount = (gross_amount * commission_rate) / 100
provider_payout = gross_amount - commission_amount
```

**Example** (Delivery order):
- Gross Amount: ₵100.00
- Commission (15%): ₵15.00
- Provider Payout: ₵85.00

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to API"
- Check that `EXPO_PUBLIC_API_BASE_URL` is set correctly
- Verify backend is running and accessible
- For physical devices, ensure phone and computer are on same WiFi
- Check firewall settings

#### 2. "Module not found"
```bash
cd frontend
rm -rf node_modules
npm install
```

#### 3. "Expo app not loading"
```bash
cd frontend
npx expo start -c  # Clear cache
```

#### 4. "Network request failed"
- Verify API URL is correct
- Check CORS settings on backend
- Ensure backend is running
- For physical devices, use your computer's LAN IP address

#### 5. "Assignment to constant variable" (Backend Error)
- Fixed: Changed `const order` to `let order` in `order.controller.js`
- This error occurred when drivers tried to accept deliveries

#### 6. "Order already assigned" Error
- This is expected when multiple drivers try to accept the same order
- The system prevents race conditions by checking order availability before assignment

#### 7. "Dark mode not working"
- Ensure `ThemeProvider` wraps the app (done in `_layout.tsx`)
- Check that screens use `useTheme()` hook
- Verify NativeWind dark mode classes are applied

#### 8. "Currency showing as $ instead of ₵"
- All currency displays have been updated to GHS
- Check that `formatGHS()` is imported and used
- Verify `CurrencyContext` is properly configured

---

## 🔒 Security & Best Practices

### Security Features

- ✅ Secure token storage using `expo-secure-store`
- ✅ Sensitive data never stored in AsyncStorage
- ✅ Development mode authentication bypass (disabled in production)
- ✅ Automatic token refresh handling
- ✅ Secure API communication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on API endpoints
- ✅ Input validation on all critical endpoints
- ✅ CORS configuration and security headers
- ✅ Admin audit logging for sensitive actions

### Code Quality

- ✅ **TypeScript**: Full type safety throughout
- ✅ **Error Boundaries**: Prevent app crashes
- ✅ **Memory Leak Prevention**: Cleanup functions in useEffect hooks
- ✅ **Request Retry Logic**: Exponential backoff for network requests
- ✅ **Structured Logging**: Centralized logger with log levels
- ✅ **Code Comments**: Key files and complex logic documented
- ✅ **Consistent Styling**: NativeWind for uniform UI
- ✅ **Dark Mode**: Full dark mode support across all screens

---

## 📚 Key Files Reference

### Core Files

#### Frontend
- **`app/_layout.tsx`**: Root layout with all providers
- **`app/index.tsx`**: Entry point with routing logic
- **`src/context/AuthContext.tsx`**: Authentication state management
- **`src/context/ThemeContext.tsx`**: Dark mode management
- **`src/context/CurrencyContext.tsx`**: Currency (GHS) management
- **`src/services/api.ts`**: API client and all API calls
- **`src/utils/navigation.ts`**: Safe navigation helper
- **`src/utils/logger.ts`**: Logging utility
- **`src/utils/storage.ts`**: Secure and regular storage
- **`src/utils/validation.ts`**: Form validation utilities
- **`src/utils/currency.ts`**: Currency formatting utilities

#### Backend
- **`server.js`**: Main server file with Socket.io
- **`controllers/order.controller.js`**: Order management logic
- **`controllers/auth.controller.js`**: Authentication logic
- **`models/Order.model.js`**: Unified Order model
- **`utils/commissionCalculator.js`**: Commission calculation
- **`utils/distance.js`**: Distance and price calculation
- **`utils/idGenerator.js`**: Deterministic ID generation

#### Admin Dashboard
- **`app/dashboard/`**: Admin pages
- **`lib/api.ts`**: API client
- **`lib/auth.ts`**: Auth utilities
- **`lib/currency.ts`**: GHS formatting

### Important Components

- **`src/components/ErrorBoundary.tsx`**: Error boundary for crash prevention
- **`src/components/LocationMapPreview.tsx`**: Map preview component
- **`src/components/SkeletonLoader.tsx`**: Loading skeleton component
- **`components/DeliveryDetailsModal.tsx`**: Delivery details modal
- **`components/OrderDetailsModal.tsx`**: Order details modal

---

## 🔄 Recent Updates

### Version 2.0.0 (Current)

#### Major Features
- ✅ Unified Order System (delivery, marketplace, sourcing, coaching)
- ✅ Multi-role system with role applications
- ✅ Commission calculation system
- ✅ GHS currency support throughout
- ✅ Real-time updates via Socket.io
- ✅ Admin and Logistics dashboards
- ✅ Driver order acceptance with race condition prevention
- ✅ Pricing consistency (users see gross_amount, providers see provider_payout)

#### Bug Fixes
- ✅ Fixed "Assignment to constant variable" error in order status update
- ✅ Fixed driver dashboard showing 0.00 for delivery prices
- ✅ Fixed driver accept delivery functionality
- ✅ Fixed admin analytics page crash
- ✅ Fixed currency displays (all now in GHS)
- ✅ Fixed driver dropdown in logistics dashboard
- ✅ Fixed state transition validation in order controller
- ✅ Fixed logout redirect to login screen
- ✅ Fixed onboarding flow (direct to signup, no role selection)

#### Improvements
- ✅ Improved error handling with user-friendly messages
- ✅ Added rate limit error handling
- ✅ Improved driver order visibility
- ✅ Added view details modals for admin dashboard
- ✅ Enhanced pricing display consistency
- ✅ Improved code organization and documentation

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the code comments in key files
3. Contact the development team

---

## 📝 Notes

### Currency
- All amounts are stored and displayed in **GHS (Ghanaian Cedis)**
- Currency symbol: **₵**
- Formatting utility: `formatGHS(amount)` in admin, `formatAmount(amount)` in mobile app

### Order System
- **Unified Order Model**: All order types (delivery, marketplace, sourcing, coaching) use the same Order model
- **State Machine**: Orders follow a strict state transition system
- **Commission**: Calculated on backend only, immutable after completion
- **Provider Assignment**: Drivers can accept available orders (first-come-first-serve)

### Role System
- **Multi-role Support**: Users can have multiple roles (user, driver, seller, etc.)
- **Role Applications**: Users apply for additional roles, admins verify
- **Active Role**: Users can switch between their verified roles
- **RBAC**: Backend checks all verified roles, not just active role

---

**Built with ❤️ by the ShipLink Team**

**Version**: 2.0.0  
**Last Updated**: 2026-01-14  
**Status**: Production Ready ✅
