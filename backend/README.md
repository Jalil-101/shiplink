# ShipLink Backend API

A complete backend API for the ShipLink logistics and delivery management platform. Built with Node.js, Express, and MongoDB.

## Features

- ✅ User authentication (register, login)
- ✅ User profile management
- ✅ Driver profile management
- ✅ Delivery request creation and management
- ✅ Real-time location tracking
- ✅ Distance and price calculation
- ✅ Driver availability management
- ✅ Delivery status tracking
- ✅ Role-based access control

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit `.env` and set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT signing
   - `PORT` - Server port (default: 5444)

5. **Start the server**
   ```bash
   # Development (with nodemon)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Drivers
- `POST /api/drivers` - Create driver profile
- `GET /api/drivers` - Get all drivers (with filters)
- `GET /api/drivers/nearby` - Get nearby drivers
- `GET /api/drivers/me/profile` - Get current driver profile
- `GET /api/drivers/:id` - Get driver by ID
- `GET /api/drivers/:id/stats` - Get driver statistics
- `PATCH /api/drivers/:id/location` - Update driver location
- `PATCH /api/drivers/:id/availability` - Toggle availability
- `PUT /api/drivers/:id` - Update driver profile
- `DELETE /api/drivers/:id` - Delete driver profile

### Delivery Requests
- `POST /api/delivery-requests` - Create delivery request
- `GET /api/delivery-requests` - Get all requests (with filters)
- `GET /api/delivery-requests/pending` - Get pending requests
- `GET /api/delivery-requests/user/my-requests` - Get user's requests
- `GET /api/delivery-requests/driver/my-requests` - Get driver's deliveries
- `GET /api/delivery-requests/:id` - Get request by ID
- `POST /api/delivery-requests/:id/accept` - Accept request (driver)
- `POST /api/delivery-requests/:id/assign` - Assign driver
- `PATCH /api/delivery-requests/:id/status` - Update status
- `PUT /api/delivery-requests/:id` - Update request
- `DELETE /api/delivery-requests/:id` - Cancel request

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Request/Response Format

### Register Request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "customer" // or "driver"
}
```

### Register Response
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "avatar": null
  },
  "token": "jwt_token_here"
}
```

### Create Delivery Request
```json
{
  "pickupLocation": {
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dropoffLocation": {
    "address": "456 Oak Ave",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "packageDetails": {
    "weight": 5.5,
    "dimensions": {
      "length": 10,
      "width": 10,
      "height": 10
    },
    "contentDescription": "Electronics"
  }
}
```

## Error Handling

All errors follow this format:
```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Database Models

### User
- name, email, phone, password, role, avatar
- Roles: `user` (customer), `driver`

### Driver
- userId, licenseNumber, vehicleType, vehicleModel, vehiclePlate
- rating, totalDeliveries, isAvailable, location

### DeliveryRequest
- receiverId, driverId, pickupLocation, dropoffLocation
- packageDetails, status, price, distance
- Statuses: `pending`, `accepted`, `picked_up`, `in_transit`, `delivered`, `cancelled`

## Price Calculation

Price is calculated based on:
- Base price: $5
- Weight: $2 per kg
- Distance: $1.50 per km

## Distance Calculation

Uses Haversine formula to calculate distance between two coordinates.

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## Environment Variables

```env
PORT=5444
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shiplink
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## Notes

- The backend accepts `"customer"` in registration but stores it as `"user"` in the database
- Responses transform `"user"` back to `"customer"` for frontend compatibility
- All passwords are hashed using bcrypt
- JWT tokens expire in 7 days (configurable)

## License

ISC

