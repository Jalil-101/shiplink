# Shilink Backend

A comprehensive delivery/shipping management backend API built with Express, TypeScript, and MongoDB.

## Features

- User authentication (JWT-based)
- Role-based authorization (Customer/Driver)
- Driver management with location tracking
- Delivery request management
- Real-time driver availability
- Distance and price calculation
- Driver statistics and earnings tracking
- Nearby driver search

## Tech Stack

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

```env
PORT=5444
MONGO_URI=mongodb://localhost:27017/shiplink
JWT_SECRET=your-super-secret-jwt-key
```

### Running the Application

Development mode (with hot reload):

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

The server will run on `http://localhost:5444` (or your configured PORT)

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Routes (`/api/users`)

- `GET /api/users` - Get all users
- `GET /api/users/me` - Get authenticated user profile
- `GET /api/users/:id` - Get user by ID

### Driver Routes (`/api/drivers`)

- `GET /api/drivers` - Get all drivers (with filters)
- `GET /api/drivers/nearby` - Find nearby available drivers
- `GET /api/drivers/:id` - Get driver by ID
- `GET /api/drivers/:id/stats` - Get driver statistics
- `POST /api/drivers` - Create driver profile
- `PUT /api/drivers/:id` - Update driver info
- `DELETE /api/drivers/:id` - Delete driver
- `PATCH /api/drivers/:id/location` - Update driver location
- `PATCH /api/drivers/:id/availability` - Toggle driver availability

### Delivery Request Routes (`/api/delivery-requests`)

- `GET /api/delivery-requests` - Get all delivery requests
- `GET /api/delivery-requests/pending` - Get pending requests
- `GET /api/delivery-requests/:id` - Get request by ID
- `GET /api/delivery-requests/user/my-requests` - Get user's requests (Customer)
- `GET /api/delivery-requests/driver/my-requests` - Get driver's requests (Driver)
- `POST /api/delivery-requests` - Create delivery request (Customer)
- `POST /api/delivery-requests/:id/accept` - Accept delivery request (Driver)
- `POST /api/delivery-requests/:id/assign` - Assign driver to request
- `PUT /api/delivery-requests/:id` - Update delivery request
- `DELETE /api/delivery-requests/:id` - Delete/cancel request
- `PATCH /api/delivery-requests/:id/status` - Update delivery status

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access

- **Customer** - Can create delivery requests and view their own requests
- **Driver** - Can accept requests, update location, view assigned deliveries

## Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Authentication & authorization middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── schemas/         # Input validation schemas
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (hash, jwt, location)
└── index.ts         # App entry point
```

## License

MIT
