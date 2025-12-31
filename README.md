# 🚀 ShipLink - Logistics Mobile App

A production-ready React Native mobile application for logistics and delivery services, built with Expo, TypeScript, and NativeWind. Features role-based authentication for users (importers) and drivers, real-time tracking, and a modern UI with full dark mode support.

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
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

ShipLink is a comprehensive logistics platform that connects:
- **Users (Importers)**: Create delivery requests, track shipments, manage orders
- **Drivers**: Accept delivery requests, manage deliveries, track earnings

### Key Capabilities

- ✅ Role-based authentication (User/Driver)
- ✅ Real-time delivery tracking
- ✅ Secure token management
- ✅ Dark mode support
- ✅ Error boundaries and crash prevention
- ✅ Retry logic for network requests
- ✅ Memory leak prevention
- ✅ Production-ready logging
- ✅ Type-safe API integration

---

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: React Context API

### Key Libraries
- **Forms**: React Hook Form + Yup validation
- **Storage**: 
  - `expo-secure-store` (sensitive data like tokens)
  - `@react-native-async-storage/async-storage` (non-sensitive data)
- **Icons**: Lucide React Native
- **Images**: expo-image
- **Maps**: React Native Maps (for location features)
- **Safe Areas**: react-native-safe-area-context

---

## ✨ Features

### User (Importer) Features
- User registration and authentication
- Create delivery requests with package details
- View order history and track deliveries
- Profile management (Edit Profile, Payment Methods)
- Settings (Security, Notifications, Help, Privacy, Terms, About)
- Sourcing agent marketplace
- Dark mode support

### Driver Features
- Driver registration and authentication
- View and accept available delivery requests
- Manage active deliveries with status updates
- Track earnings and statistics
- Vehicle information management
- Profile and settings management
- Dark mode support

### Shared Features
- Onboarding flow with role selection
- Secure authentication with token management
- Error boundaries for graceful error handling
- Network retry logic with exponential backoff
- Comprehensive logging system
- Responsive design for all screen sizes

---

## 📁 Project Structure

```
shiplink-fullstack/
├── frontend/                    # React Native app
│   ├── app/                     # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout with providers
│   │   ├── index.tsx           # Entry point with redirect logic
│   │   ├── (onboarding)/       # Onboarding flow
│   │   │   ├── splash.tsx
│   │   │   ├── features.tsx
│   │   │   └── role-selection.tsx
│   │   ├── (auth)/             # Authentication screens
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (user)/             # User role screens
│   │   │   ├── _layout.tsx     # User tabs layout
│   │   │   ├── (tabs)/         # User tab screens
│   │   │   │   ├── home.tsx
│   │   │   │   ├── track.tsx
│   │   │   │   ├── orders.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── create-delivery.tsx
│   │   │   ├── edit-profile.tsx
│   │   │   ├── payment-methods.tsx
│   │   │   ├── settings.tsx
│   │   │   ├── security.tsx
│   │   │   ├── notifications.tsx
│   │   │   ├── help.tsx
│   │   │   ├── about.tsx
│   │   │   ├── privacy.tsx
│   │   │   ├── terms.tsx
│   │   │   └── sourcing-agent.tsx
│   │   └── (driver)/           # Driver role screens
│   │       ├── _layout.tsx     # Driver tabs layout
│   │       ├── (tabs)/         # Driver tab screens
│   │       │   ├── dashboard.tsx
│   │       │   ├── deliveries.tsx
│   │       │   ├── maps.tsx
│   │       │   └── earnings.tsx
│   │       ├── edit-profile.tsx
│   │       ├── vehicle-info.tsx
│   │       ├── create-profile.tsx
│   │       ├── settings.tsx
│   │       ├── security.tsx
│   │       ├── notifications.tsx
│   │       ├── help.tsx
│   │       ├── about.tsx
│   │       ├── privacy.tsx
│   │       └── terms.tsx
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LocationMapPreview.tsx
│   │   │   └── SkeletonLoader.tsx
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.tsx # Authentication state
│   │   │   └── ThemeContext.tsx # Dark mode management
│   │   ├── services/           # API service layer
│   │   │   └── api.ts          # Centralized API client
│   │   ├── types/              # TypeScript definitions
│   │   │   ├── api.ts          # API request/response types
│   │   │   └── index.ts        # General types
│   │   ├── utils/              # Utility functions
│   │   │   ├── logger.ts       # Logging utility
│   │   │   ├── storage.ts      # Secure/regular storage
│   │   │   ├── navigation.ts   # Safe navigation helper
│   │   │   ├── location.ts     # Location utilities
│   │   │   └── analytics.ts    # Analytics tracking
│   │   └── constants/         # App constants
│   ├── assets/                 # Images, fonts, SVGs
│   ├── SVGs/                   # Custom SVG assets
│   ├── components/             # Expo-generated components
│   ├── global.css              # Global styles
│   ├── app.json                # Expo configuration
│   ├── package.json
│   └── tsconfig.json
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **Expo CLI** (optional): `npm install -g expo-cli`
- **iOS Simulator** (Mac only) or **Android Studio** (for Android emulator)
- **Expo Go** app on your phone (for physical device testing)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd shiplink-fullstack
```

2. **Install dependencies**
```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   # Production API URL (when backend is hosted)
   EXPO_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
   
   # OR for local development:
   # EXPO_PUBLIC_API_BASE_URL=http://localhost:5444/api
   
   # OR for physical device testing (use your computer's IP):
   # EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5444/api
   ```

4. **Start the development server**
```bash
   npm start
```

   Or from the root directory:
```bash
npm run dev
```

5. **Run on device/emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

---

## 💻 Development

### Development Mode Authentication

The app includes **mock authentication** for development mode. This allows you to test UI flows without a connected backend:

- **Any email/password** will work in development mode
- Email containing "driver" → logs in as driver role
- Any other email → logs in as user role
- Mock authentication is automatically disabled in production builds

### Running the App

```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Project Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
```

### Development Workflow

1. **Make changes** to files in `frontend/`
2. **Hot reload** - Changes appear automatically
3. **Check console** for errors and API logs
4. **Test on device** - Use Expo Go app for physical device testing

---

## ⚙️ Configuration

### Environment Variables

Create `frontend/.env`:

```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://shilink-backend.onrender.com/api

# For local development:
# EXPO_PUBLIC_API_BASE_URL=http://localhost:5444/api

# For physical device (use your computer's LAN IP):
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5444/api
```

### API Configuration

The app connects to a backend API. The API base URL is configured in:
- `frontend/.env` file (for environment-specific URLs)
- `frontend/src/services/api.ts` (for default fallback and platform-specific URLs)

**Platform-specific defaults:**
- Android emulator: `http://10.0.2.2:5444/api`
- iOS simulator: `http://127.0.0.1:5444/api`
- Physical devices: Must set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP

---

## 🏗️ Architecture

### State Management

- **AuthContext**: Manages authentication state, user data, and login/logout
- **ThemeContext**: Manages dark/light mode preference
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

**Key Methods:**
- `login()` - User/driver authentication
- `register()` - User/driver registration
- `getMyRequests()` - Get user's delivery requests
- `getPendingRequests()` - Get available requests (driver)
- `createDeliveryRequest()` - Create new delivery
- `updateDeliveryRequest()` - Update delivery status
- `getMyDriverProfile()` - Get driver profile
- And more...

### Navigation

**File-based routing** with Expo Router:
- Routes are defined by file structure in `app/` directory
- Protected routes based on authentication status
- Role-based navigation (User/Driver tabs)
- Safe navigation helper (`useSafeNavigation`) for back button handling

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

## 🔒 Code Quality

### Security Features

- ✅ Secure token storage using `expo-secure-store`
- ✅ Sensitive data never stored in AsyncStorage
- ✅ Development mode authentication bypass (disabled in production)
- ✅ Automatic token refresh handling
- ✅ Secure API communication

### Best Practices Implemented

- ✅ **TypeScript**: Full type safety throughout
- ✅ **Error Boundaries**: Prevent app crashes
- ✅ **Memory Leak Prevention**: Cleanup functions in useEffect hooks
- ✅ **Request Retry Logic**: Exponential backoff for network requests
- ✅ **Structured Logging**: Centralized logger with log levels
- ✅ **Code Comments**: Key files and complex logic documented
- ✅ **Consistent Styling**: NativeWind for uniform UI
- ✅ **Dark Mode**: Full dark mode support across all screens

### Code Organization

- **Separation of Concerns**: Clear separation between UI, logic, and data
- **Reusable Components**: Shared components in `src/components/`
- **Utility Functions**: Common utilities in `src/utils/`
- **Type Definitions**: All types in `src/types/`
- **Context Providers**: Global state in `src/context/`

---

## 🚢 Deployment

### Building for Production

```bash
cd frontend

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Prerequisites for Production Build

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: `npm install -g eas-cli`
3. **Configure app.json**: Update app name, bundle ID, etc.

### Environment Setup for Production

1. Set production API URL in `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://shilink-backend.onrender.com/api
   ```

2. Build with EAS:
```bash
   eas build --platform android --profile production
   ```

3. **Important**: Mock authentication is automatically disabled in production builds

### Build Process

When you build the app:
- Environment variables are embedded at build time
- Code is minified and optimized
- Mock authentication is disabled
- Production logging is configured (only errors/warnings)

**Note**: After building, you can't change the API URL without rebuilding. Make sure to set the correct production URL before building.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to API"
- Check that `EXPO_PUBLIC_API_BASE_URL` is set correctly
- Verify backend is running and accessible
- For physical devices, ensure phone and computer are on same WiFi
- Check firewall settings
- **See detailed guides:**
  - `frontend/TROUBLESHOOTING_NETWORK.md` - Network connection issues
  - `frontend/CONNECTING_PHONE.md` - Physical device setup

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

#### 5. "Back button redirects to home/dashboard"
- This is fixed with the `useSafeNavigation` helper
- If still occurring, check that all screens use `goBack()` from `useSafeNavigation`

#### 6. "Dark mode not working"
- Ensure `ThemeProvider` wraps the app (done in `_layout.tsx`)
- Check that screens use `useTheme()` hook
- Verify NativeWind dark mode classes are applied

---

## 📚 Key Files Reference

### Core Files

- **`app/_layout.tsx`**: Root layout with all providers
- **`app/index.tsx`**: Entry point with routing logic
- **`src/context/AuthContext.tsx`**: Authentication state management
- **`src/context/ThemeContext.tsx`**: Dark mode management
- **`src/services/api.ts`**: API client and all API calls
- **`src/utils/navigation.ts`**: Safe navigation helper
- **`src/utils/logger.ts`**: Logging utility
- **`src/utils/storage.ts`**: Secure and regular storage

### Important Components

- **`src/components/ErrorBoundary.tsx`**: Error boundary for crash prevention
- **`src/components/LocationMapPreview.tsx`**: Map preview component
- **`src/components/SkeletonLoader.tsx`**: Loading skeleton component

---

## 🔄 Recent Updates

### Navigation Fix
- Implemented safe navigation helper to prevent back button redirects
- Fixed navigation flow: nested screens → Settings → Profile/Dashboard tabs
- Removed duplicate menu items between Profile and Settings screens

### Dark Mode
- Full dark mode support across all screens
- Theme preference persistence
- System theme detection

### Code Quality
- Added comprehensive comments to key files
- Implemented error boundaries
- Added retry logic for network requests
- Secure storage for sensitive data
- Memory leak prevention

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
3. Check `frontend/TROUBLESHOOTING_NETWORK.md` for network issues
4. Contact the development team

---

**Built with ❤️ by the ShipLink Team**
