# 🚀 ShipLink - Mobile App (Frontend)

React Native mobile application for ShipLink logistics platform. Built with Expo and TypeScript.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Configuration](#configuration)
- [Deployment](#deployment)

---

## 🎯 Project Overview

ShipLink mobile app enables:

- **Customers** to create delivery requests and track shipments
- **Drivers** to accept delivery requests and manage deliveries
- **Real-time tracking** with location updates
- **Earnings tracking** for drivers
- **Order management** for customers

---

## 🛠️ Tech Stack

- **Framework**: React Native + Expo v54
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Forms**: React Hook Form + Yup validation
- **Storage**: AsyncStorage
- **Icons**: Lucide React Native
- **Maps**: React Native Maps

---

## 📁 Project Structure

```
shiplink-frontend/
├── frontend/
│   ├── app/                    # Expo Router screens
│   │   ├── (auth)/             # Authentication screens
│   │   ├── (user)/             # Customer screens
│   │   ├── (driver)/           # Driver screens
│   │   └── (onboarding)/       # Onboarding flow
│   ├── components/             # Reusable UI components
│   ├── src/
│   │   ├── context/            # React Context providers
│   │   ├── services/           # API service layer
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── components/         # Shared components
│   ├── assets/                 # Images, fonts, etc.
│   ├── constants/              # App constants
│   └── package.json
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **Expo CLI** (optional, but recommended)
- **iOS Simulator** (Mac only) or **Android Studio** (for Android emulator)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd shiplink-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install dependencies in the `frontend` directory.

3. **Configure API endpoint**
   
   Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   ```
   
   Create `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
   ```
   
   For development with local backend:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5444/api
   ```
   
   For physical device testing, use your computer's IP:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5444/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Or from root:
   ```bash
   npm run dev
   ```

5. **Run on device/emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

---

## 💻 Development

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
EXPO_PUBLIC_API_BASE_URL=https://api.shiplink.com/api

# Development
# EXPO_PUBLIC_API_BASE_URL=http://localhost:5444/api
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5444/api
```

### API Configuration

The app connects to a backend API. Update the API base URL in:
- `frontend/.env` file (for environment-specific URLs)
- `frontend/src/services/api.ts` (for default fallback)

---

## 📱 Features

### Customer Features
- ✅ User registration and authentication
- ✅ Create delivery requests
- ✅ View order history
- ✅ Track deliveries in real-time
- ✅ Profile management

### Driver Features
- ✅ Driver registration and authentication
- ✅ View available delivery requests
- ✅ Accept delivery requests
- ✅ Manage active deliveries
- ✅ Track earnings
- ✅ Update delivery status

### Shared Features
- ✅ Onboarding flow
- ✅ Role-based navigation
- ✅ Dark mode support
- ✅ Responsive design

---

## 🏗️ Architecture

### State Management
- **AuthContext**: Handles authentication state
- **React Context API**: For global state
- **AsyncStorage**: For persistent storage

### API Service
- Centralized API service in `src/services/api.ts`
- Automatic token management
- Error handling and retry logic
- Network error detection

### Navigation
- File-based routing with Expo Router
- Protected routes based on authentication
- Role-based navigation (Customer/Driver)

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

### Environment Setup

1. Set production API URL in `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://api.shiplink.com/api
   ```

2. Build with EAS:
   ```bash
   eas build --platform android --profile production
   ```

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

---

## 📚 Additional Documentation

- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [Development Guide](./frontend/DEVELOPMENT_GUIDE.md) - Development workflow
- [Onboarding Guide](./frontend/ONBOARDING_README.md) - Onboarding flow details
- [Troubleshooting Network](./frontend/TROUBLESHOOTING_NETWORK.md) - Network issues
- [Connecting Phone](./frontend/CONNECTING_PHONE.md) - Physical device setup

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
1. Check the documentation in this repo
2. Review troubleshooting guides
3. Contact the development team

---

**Built with ❤️ by the ShipLink Team**
