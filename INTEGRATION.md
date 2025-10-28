# 🔗 API Integration Guide

Complete guide for integrating the ShipLink frontend with the backend API.

---

## 📋 Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)
6. [Testing APIs](#testing-apis)

---

## 🌐 Base Configuration

### API URLs

| Environment | Base URL                                              |
| ----------- | ----------------------------------------------------- |
| Development | `http://localhost:5444`                               |
| Production  | `https://api.shiplink.com` (configure when deploying) |

### Headers

All API requests should include:

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <jwt-token>' // For protected routes
}
```

---

## 🔐 Authentication Flow

### How JWT Authentication Works

1. **User registers or logs in** → Backend returns JWT token
2. **Store token** in AsyncStorage (frontend)
3. **Include token** in Authorization header for protected routes
4. **Token expires** after 7 days (configurable in backend)

### Role-Based Access

- **Customer** (role: "Customer") - Can create delivery requests
- **Driver** (role: "Driver") - Can accept delivery requests

Frontend User Role Mapping:

- Frontend "user" = Backend "Customer"
- Frontend "driver" = Backend "Driver"

---

## 📡 API Endpoints

### Authentication Routes

#### POST `/api/auth/register`

Register a new user (Customer or Driver).

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "password": "password123",
  "role": "Customer" // or "Driver"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "role": "Customer",
      "createdAt": "2024-10-27T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "User already exists"
}
```

---

#### POST `/api/auth/login`

Login existing user.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "role": "Customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### User Routes

#### GET `/api/users/me`

Get authenticated user profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "role": "Customer",
    "createdAt": "2024-10-27T12:00:00.000Z"
  }
}
```

---

#### GET `/api/users/:id`

Get user by ID.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Customer"
  }
}
```

---

### Driver Routes

#### POST `/api/drivers`

Create driver profile (must be logged in as Driver).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "licenseNumber": "DL123456",
  "vehicleType": "car", // or "truck", "motorcycle"
  "vehicleModel": "Toyota Camry 2020",
  "vehiclePlate": "ABC-1234"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "licenseNumber": "DL123456",
    "vehicleType": "car",
    "vehicleModel": "Toyota Camry 2020",
    "vehiclePlate": "ABC-1234",
    "isAvailable": false,
    "rating": 0,
    "totalDeliveries": 0,
    "totalEarnings": 0
  }
}
```

---

#### GET `/api/drivers`

Get all drivers with optional filters.

**Query Parameters:**

- `vehicleType` - Filter by vehicle type
- `isAvailable` - Filter by availability (true/false)

**Example:** `/api/drivers?vehicleType=car&isAvailable=true`

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": {
        "name": "Driver One",
        "mobile": "+1234567890"
      },
      "vehicleType": "car",
      "isAvailable": true,
      "rating": 4.5,
      "totalDeliveries": 150
    }
  ]
}
```

---

#### GET `/api/drivers/nearby`

Find nearby available drivers.

**Query Parameters:**

- `latitude` (required) - User's latitude
- `longitude` (required) - User's longitude
- `maxDistance` (optional) - Maximum distance in km (default: 10)

**Example:** `/api/drivers/nearby?latitude=5.6037&longitude=-0.1870&maxDistance=5`

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": {
        "name": "Driver One",
        "mobile": "+1234567890"
      },
      "vehicleType": "car",
      "distance": 2.5, // km from your location
      "rating": 4.8
    }
  ]
}
```

---

#### PATCH `/api/drivers/:id/location`

Update driver location (Driver only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "latitude": 5.6037,
  "longitude": -0.187
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 5.6037,
      "longitude": -0.187
    }
  }
}
```

---

#### PATCH `/api/drivers/:id/availability`

Toggle driver availability (Driver only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "isAvailable": true // or false
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "isAvailable": true
  }
}
```

---

#### GET `/api/drivers/:id/stats`

Get driver statistics.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "totalDeliveries": 150,
    "completedDeliveries": 145,
    "cancelledDeliveries": 5,
    "totalEarnings": 5420.5,
    "averageRating": 4.8,
    "totalReviews": 120
  }
}
```

---

### Delivery Request Routes

#### POST `/api/delivery-requests`

Create a new delivery request (Customer only).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "pickupAddress": "123 Main St, Accra",
  "deliveryAddress": "456 Oak Ave, Tema",
  "pickupCoordinates": {
    "latitude": 5.6037,
    "longitude": -0.187
  },
  "deliveryCoordinates": {
    "latitude": 5.6395,
    "longitude": -0.0443
  },
  "packageDescription": "Electronics - Laptop",
  "packageWeight": 2.5, // kg
  "packageValue": 1000, // USD
  "recipientName": "Jane Smith",
  "recipientPhone": "+1234567890"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "customer": "507f1f77bcf86cd799439011",
    "pickupAddress": "123 Main St, Accra",
    "deliveryAddress": "456 Oak Ave, Tema",
    "packageDescription": "Electronics - Laptop",
    "status": "pending",
    "price": 45.5,
    "distance": 15.2, // km
    "createdAt": "2024-10-27T12:00:00.000Z"
  }
}
```

---

#### GET `/api/delivery-requests`

Get all delivery requests (with filters).

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` - Filter by status (pending, accepted, in_transit, delivered, cancelled)
- `customerId` - Filter by customer ID
- `driverId` - Filter by driver ID

**Example:** `/api/delivery-requests?status=pending`

**Success Response (200):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "customer": {
        "name": "John Doe",
        "mobile": "+1234567890"
      },
      "pickupAddress": "123 Main St, Accra",
      "deliveryAddress": "456 Oak Ave, Tema",
      "status": "pending",
      "price": 45.5,
      "distance": 15.2,
      "createdAt": "2024-10-27T12:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/delivery-requests/pending`

Get all pending delivery requests (available for drivers to accept).

**Success Response (200):**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "customer": {
        "name": "John Doe",
        "mobile": "+1234567890"
      },
      "pickupAddress": "123 Main St, Accra",
      "deliveryAddress": "456 Oak Ave, Tema",
      "price": 45.5,
      "distance": 15.2,
      "packageDescription": "Electronics - Laptop",
      "createdAt": "2024-10-27T12:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/delivery-requests/user/my-requests`

Get current user's delivery requests (Customer).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "pickupAddress": "123 Main St, Accra",
      "deliveryAddress": "456 Oak Ave, Tema",
      "status": "in_transit",
      "driver": {
        "name": "Driver One",
        "mobile": "+1234567890",
        "vehicleType": "car"
      },
      "price": 45.5,
      "createdAt": "2024-10-27T12:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/delivery-requests/driver/my-requests`

Get driver's assigned delivery requests (Driver).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "customer": {
        "name": "John Doe",
        "mobile": "+1234567890"
      },
      "pickupAddress": "123 Main St, Accra",
      "deliveryAddress": "456 Oak Ave, Tema",
      "status": "accepted",
      "price": 45.5,
      "distance": 15.2,
      "acceptedAt": "2024-10-27T12:30:00.000Z"
    }
  ]
}
```

---

#### POST `/api/delivery-requests/:id/accept`

Accept a delivery request (Driver only).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "accepted",
    "driver": "507f1f77bcf86cd799439012",
    "acceptedAt": "2024-10-27T12:30:00.000Z"
  }
}
```

---

#### PATCH `/api/delivery-requests/:id/status`

Update delivery status.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "status": "in_transit" // or "delivered", "cancelled"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "in_transit",
    "updatedAt": "2024-10-27T13:00:00.000Z"
  }
}
```

---

#### DELETE `/api/delivery-requests/:id`

Cancel a delivery request (Customer only, only if status is "pending").

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Delivery request cancelled successfully"
}
```

---

## 💻 Frontend Integration

### Step 1: Create API Service Layer

Create `frontend/src/services/api.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = __DEV__
  ? "http://localhost:5444/api"
  : "https://api.shiplink.com/api";

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem("authToken");
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token && !endpoint.includes("/auth/")) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    mobile: string;
    password: string;
    role: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Users
  async getProfile() {
    return this.request("/users/me");
  }

  // Drivers
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    maxDistance = 10
  ) {
    return this.request(
      `/drivers/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`
    );
  }

  async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number
  ) {
    return this.request(`/drivers/${driverId}/location`, {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async toggleDriverAvailability(driverId: string, isAvailable: boolean) {
    return this.request(`/drivers/${driverId}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable }),
    });
  }

  // Delivery Requests
  async createDeliveryRequest(requestData: any) {
    return this.request("/delivery-requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  async getPendingRequests() {
    return this.request("/delivery-requests/pending");
  }

  async getMyRequests() {
    return this.request("/delivery-requests/user/my-requests");
  }

  async getMyDeliveries() {
    return this.request("/delivery-requests/driver/my-requests");
  }

  async acceptDeliveryRequest(requestId: string) {
    return this.request(`/delivery-requests/${requestId}/accept`, {
      method: "POST",
    });
  }

  async updateDeliveryStatus(requestId: string, status: string) {
    return this.request(`/delivery-requests/${requestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

export const apiService = new ApiService();
```

### Step 2: Update AuthContext

Update `frontend/src/context/AuthContext.tsx`:

```typescript
import { apiService } from "../services/api";

// In login function:
const login = async (email: string, password: string) => {
  try {
    dispatch({ type: "LOGIN_START" });

    // Real API call
    const response = await apiService.login(email, password);

    const user = {
      ...response.data.user,
      role: response.data.user.role === "Customer" ? "user" : "driver",
    };

    await AsyncStorage.setItem("authToken", response.data.token);
    await AsyncStorage.setItem("userData", JSON.stringify(user));

    dispatch({ type: "LOGIN_SUCCESS", payload: user });
  } catch (error: any) {
    dispatch({ type: "LOGIN_FAILURE", payload: error.message });
  }
};

// In register function:
const register = async (userData: any) => {
  try {
    dispatch({ type: "LOGIN_START" });

    const backendRole = userData.role === "user" ? "Customer" : "Driver";

    const response = await apiService.register({
      ...userData,
      role: backendRole,
    });

    const user = {
      ...response.data.user,
      role: response.data.user.role === "Customer" ? "user" : "driver",
    };

    await AsyncStorage.setItem("authToken", response.data.token);
    await AsyncStorage.setItem("userData", JSON.stringify(user));
    await AsyncStorage.setItem("onboardingComplete", "true");

    dispatch({ type: "LOGIN_SUCCESS", payload: user });
    dispatch({ type: "SET_ONBOARDING_COMPLETE", payload: true });
  } catch (error: any) {
    dispatch({ type: "LOGIN_FAILURE", payload: error.message });
  }
};
```

### Step 3: Use in Components

Example: Creating a delivery request

```typescript
import { apiService } from "../../../src/services/api";

const handleCreateRequest = async () => {
  try {
    setLoading(true);

    const result = await apiService.createDeliveryRequest({
      pickupAddress: "123 Main St",
      deliveryAddress: "456 Oak Ave",
      pickupCoordinates: { latitude: 5.6037, longitude: -0.187 },
      deliveryCoordinates: { latitude: 5.6395, longitude: -0.0443 },
      packageDescription: "Electronics",
      packageWeight: 2.5,
      packageValue: 1000,
      recipientName: "John Doe",
      recipientPhone: "+1234567890",
    });

    console.log("Request created:", result);
    setLoading(false);
  } catch (error) {
    console.error("Error:", error);
    setLoading(false);
  }
};
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning      | Action                                    |
| ---- | ------------ | ----------------------------------------- |
| 200  | OK           | Request successful                        |
| 201  | Created      | Resource created successfully             |
| 400  | Bad Request  | Invalid input data                        |
| 401  | Unauthorized | Invalid/missing token - redirect to login |
| 403  | Forbidden    | Valid token but insufficient permissions  |
| 404  | Not Found    | Resource doesn't exist                    |
| 500  | Server Error | Backend error - show error message        |

### Error Handling Example

```typescript
try {
  const result = await apiService.createDeliveryRequest(data);
  // Handle success
} catch (error: any) {
  if (error.message.includes("401")) {
    // Token expired - logout user
    await logout();
    router.push("/(auth)/login");
  } else if (error.message.includes("400")) {
    // Invalid input - show validation errors
    Alert.alert("Error", error.message);
  } else {
    // General error
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
}
```

---

## 🧪 Testing APIs

### Using Postman

1. **Create a new request collection** for ShipLink
2. **Add environment variables**:
   - `base_url`: `http://localhost:5444/api`
   - `token`: (will be set after login)

3. **Test authentication**:
   - POST `{{base_url}}/auth/register`
   - POST `{{base_url}}/auth/login`
   - Copy token from response
   - Set `token` variable

4. **Test protected routes**:
   - Add Authorization header: `Bearer {{token}}`
   - Test all endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5444/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","mobile":"+1234567890","password":"password123","role":"Customer"}'

# Login
curl -X POST http://localhost:5444/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl -X GET http://localhost:5444/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 📝 Notes

- All coordinates use latitude/longitude format
- Distances are in kilometers
- Prices are in USD
- Timestamps are in ISO 8601 format
- Role mapping: Frontend "user" = Backend "Customer", Frontend "driver" = Backend "Driver"

---

**For questions or issues, contact the backend team or refer to HANDOVER.md**
