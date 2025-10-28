# 🚀 ShipLink - Full Stack Logistics Platform

Complete logistics platform connecting importers with logistics companies and drivers. Built with React Native (Frontend) and Node.js/Express (Backend).

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Team Handover Guide](#team-handover-guide)

---

## 🎯 Project Overview

ShipLink is a comprehensive delivery/shipping management platform that enables:

- **Importers** to find logistics companies and track shipments
- **Drivers** to accept delivery requests and manage deliveries
- **Real-time tracking** with location updates
- **Earnings tracking** for drivers
- **Order management** for customers

---

## 🛠️ Tech Stack

### Frontend (Mobile App)

- **Framework**: React Native + Expo v54
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based)
- **State Management**: React Context API
- **Forms**: React Hook Form + Yup validation
- **Storage**: AsyncStorage
- **Icons**: Lucide React Native

### Backend (API Server)

- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Bcrypt for password hashing
- **Port**: 5444

---

## 📁 Project Structure

```
shiplink-fullstack/
├── 📂 frontend/              # React Native mobile app
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/          # Authentication screens
│   │   ├── (user)/          # User/Importer screens
│   │   ├── (driver)/        # Driver screens
│   │   └── (onboarding)/    # Onboarding flow
│   ├── components/           # Reusable UI components
│   ├── src/
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md            # Frontend documentation
│
├── 📂 backend/               # Express API server
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth & authorization middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Input validation schemas
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions (hash, jwt, location)
│   │   └── index.ts         # App entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── README.md            # Backend documentation
│
├── 📄 package.json           # Root package.json (runs both)
├── 📄 README.md             # This file
├── 📄 HANDOVER.md           # Comprehensive handover guide
├── 📄 INTEGRATION.md        # API integration documentation
└── 📄 .env.example          # Environment variables template
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or cloud) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn**
- **Git**
- **Code Editor** (VS Code/Cursor recommended)

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd shiplink-fullstack
```

#### 2. Install All Dependencies

```bash
npm run install:all
```

This will install dependencies for:

- Root (concurrently for running both servers)
- Frontend (React Native dependencies)
- Backend (Express dependencies)

#### 3. Set Up Environment Variables

**Backend:**

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with your configuration:

```env
PORT=5444
MONGO_URI=mongodb://localhost:27017/shiplink
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Frontend:**
The frontend automatically connects to `http://localhost:5444` in development mode.

#### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod
```

#### 5. Run Both Frontend and Backend

```bash
# From the root directory
npm run dev
```

This will start:

- ✅ **Backend API** at `http://localhost:5444`
- ✅ **Frontend** with Expo DevTools

---

## 💻 Development

### Running Services Separately

```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend
```

### Frontend Development

```bash
cd frontend

# Start Expo dev server
npm start

# Run on specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Backend Development

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

---

## 📚 API Documentation

### Base URLs

- **Development**: `http://localhost:5444`
- **Production**: `https://api.shiplink.com` (configure in deployment)

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Users

- `GET /api/users/me` - Get authenticated user profile
- `GET /api/users/:id` - Get user by ID

#### Drivers

- `GET /api/drivers` - Get all drivers (with filters)
- `GET /api/drivers/nearby` - Find nearby available drivers
- `POST /api/drivers` - Create driver profile
- `PATCH /api/drivers/:id/location` - Update driver location
- `PATCH /api/drivers/:id/availability` - Toggle driver availability

#### Delivery Requests

- `GET /api/delivery-requests` - Get all delivery requests
- `GET /api/delivery-requests/pending` - Get pending requests
- `POST /api/delivery-requests` - Create delivery request (Customer)
- `POST /api/delivery-requests/:id/accept` - Accept delivery request (Driver)
- `PATCH /api/delivery-requests/:id/status` - Update delivery status

For complete API documentation, see [INTEGRATION.md](./INTEGRATION.md)

---

## 🌐 Deployment

### Frontend (Mobile App)

#### Development Build

```bash
cd frontend
npx expo start
```

#### Production Build

```bash
cd frontend

# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios
```

### Backend (API Server)

#### Using Node.js

```bash
cd backend
npm run build
npm start
```

#### Using PM2

```bash
cd backend
npm install -g pm2
npm run build
pm2 start dist/index.js --name shiplink-api
```

#### Environment Variables (Production)

Make sure to set these in your production environment:

- `PORT` - API server port
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV=production`

---

## 👥 Team Handover Guide

### For New Developers

1. **Read this README** for project overview
2. **Read [HANDOVER.md](./HANDOVER.md)** for detailed setup and development workflow
3. **Read [INTEGRATION.md](./INTEGRATION.md)** for API integration details
4. **Set up your development environment** following Quick Start
5. **Run the app** with `npm run dev`

### Project Status

✅ **Completed:**

- Complete onboarding flow
- Authentication UI and backend
- User & Driver dashboards
- Order/delivery tracking UI
- Profile management
- Backend API with MongoDB
- JWT authentication
- Role-based authorization
- Driver location tracking
- Delivery request management

🔨 **In Progress:**

- Frontend-Backend integration (API calls from frontend)
- Real-time notifications
- Payment integration

📋 **To Do:**

- Production deployment setup
- Push notifications
- Advanced analytics
- Admin dashboard

### Key Contacts

- **Project Lead**: [Name] - [Email]
- **Backend Team**: [Contact Info]
- **Frontend Team**: [Contact Info]

---

## 📖 Additional Documentation

- **[HANDOVER.md](./HANDOVER.md)** - Comprehensive handover guide with setup instructions
- **[INTEGRATION.md](./INTEGRATION.md)** - API integration guide and endpoint documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend-specific documentation
- **[backend/README.md](./backend/README.md)** - Backend-specific documentation

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
2. Review `HANDOVER.md` for common setup issues
3. Contact the team leads (see Key Contacts above)

---

**Built with ❤️ by the ShipLink Team**
