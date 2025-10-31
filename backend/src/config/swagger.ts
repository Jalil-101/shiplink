import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shiplink API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Shiplink delivery and logistics platform. This API provides endpoints for user authentication, driver management, and delivery request handling.',
      contact: {
        name: 'Shiplink Support',
        email: 'support@shiplink.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5444',
        description: 'Development server',
      },
      {
        url: 'https://api.shiplink.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer {token}',
        },
      },
      schemas: {
        // Authentication Schemas
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'phone', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              description: 'Phone number of the user',
              example: '+1234567890',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (minimum 6 characters)',
              example: 'securePassword123',
              minLength: 6,
            },
            role: {
              type: 'string',
              enum: ['customer', 'driver'],
              description: 'Role of the user in the system',
              example: 'customer',
            },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'securePassword123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful',
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        // User Schemas
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '60d5ec49f1b2c8b1f8e4e1a1',
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john.doe@example.com',
            },
            phone: {
              type: 'string',
              description: 'Phone number of the user',
              example: '+1234567890',
            },
            role: {
              type: 'string',
              enum: ['user', 'driver'],
              description: 'Role of the user',
              example: 'user',
            },
            avatar: {
              type: 'string',
              description: 'URL to user avatar image',
              example: 'https://example.com/avatar.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user was created',
              example: '2023-10-01T12:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the user was last updated',
              example: '2023-10-01T12:00:00.000Z',
            },
          },
        },
        // Driver Schemas
        Location: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate',
              example: 37.7749,
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
              example: -122.4194,
            },
          },
        },
        Driver: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the driver',
              example: '60d5ec49f1b2c8b1f8e4e1a2',
            },
            role: {
              type: 'string',
              enum: ['driver'],
              description: 'Role must be driver',
              example: 'driver',
            },
            licenseNumber: {
              type: 'string',
              description: 'Driver license number',
              example: 'DL123456789',
            },
            vehicleType: {
              type: 'string',
              enum: ['car', 'truck', 'motorcycle'],
              description: 'Type of vehicle the driver uses',
              example: 'car',
            },
            vehicleModel: {
              type: 'string',
              description: 'Model of the vehicle',
              example: 'Toyota Camry 2020',
            },
            vehiclePlate: {
              type: 'string',
              description: 'License plate number of the vehicle',
              example: 'ABC-1234',
            },
            rating: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 5,
              description: 'Average rating of the driver',
              example: 4.5,
            },
            totalDeliveries: {
              type: 'number',
              format: 'integer',
              minimum: 0,
              description: 'Total number of completed deliveries',
              example: 150,
            },
            isAvailable: {
              type: 'boolean',
              description: 'Whether the driver is currently available',
              example: true,
            },
            location: {
              $ref: '#/components/schemas/Location',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the driver was created',
              example: '2023-10-01T12:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the driver was last updated',
              example: '2023-10-01T12:00:00.000Z',
            },
          },
        },
        DriverInput: {
          type: 'object',
          required: ['role', 'licenseNumber', 'vehicleType', 'vehicleModel', 'vehiclePlate', 'rating', 'totalDeliveries', 'isAvailable'],
          properties: {
            role: {
              type: 'string',
              enum: ['driver'],
              description: 'Role must be driver',
              example: 'driver',
            },
            licenseNumber: {
              type: 'string',
              description: 'Driver license number',
              example: 'DL123456789',
            },
            vehicleType: {
              type: 'string',
              enum: ['car', 'truck', 'motorcycle'],
              description: 'Type of vehicle',
              example: 'car',
            },
            vehicleModel: {
              type: 'string',
              description: 'Model of the vehicle',
              example: 'Toyota Camry 2020',
            },
            vehiclePlate: {
              type: 'string',
              description: 'License plate number',
              example: 'ABC-1234',
            },
            rating: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 5,
              description: 'Initial rating',
              example: 5.0,
            },
            totalDeliveries: {
              type: 'number',
              format: 'integer',
              minimum: 0,
              description: 'Initial delivery count',
              example: 0,
            },
            isAvailable: {
              type: 'boolean',
              description: 'Availability status',
              example: true,
            },
            location: {
              $ref: '#/components/schemas/Location',
            },
          },
        },
        DriverStats: {
          type: 'object',
          properties: {
            totalDeliveries: {
              type: 'number',
              description: 'Total number of completed deliveries',
              example: 150,
            },
            rating: {
              type: 'number',
              description: 'Average rating',
              example: 4.5,
            },
            completionRate: {
              type: 'number',
              description: 'Percentage of successfully completed deliveries',
              example: 98.5,
            },
            activeRequests: {
              type: 'number',
              description: 'Number of currently active delivery requests',
              example: 3,
            },
          },
        },
        LocationUpdate: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate',
              example: 37.7749,
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
              example: -122.4194,
            },
          },
        },
        // Delivery Request Schemas
        DeliveryRequest: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the delivery request',
              example: '60d5ec49f1b2c8b1f8e4e1a3',
            },
            receiverId: {
              type: 'string',
              description: 'ID of the user requesting the delivery',
              example: '60d5ec49f1b2c8b1f8e4e1a1',
            },
            driverId: {
              type: 'string',
              description: 'ID of the assigned driver',
              example: '60d5ec49f1b2c8b1f8e4e1a2',
            },
            pickupLocation: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  description: 'Pickup address',
                  example: '123 Main St, San Francisco, CA 94102',
                },
                latitude: {
                  type: 'number',
                  format: 'float',
                  example: 37.7749,
                },
                longitude: {
                  type: 'number',
                  format: 'float',
                  example: -122.4194,
                },
              },
            },
            dropoffLocation: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  description: 'Dropoff address',
                  example: '456 Oak Ave, San Francisco, CA 94103',
                },
                latitude: {
                  type: 'number',
                  format: 'float',
                  example: 37.7849,
                },
                longitude: {
                  type: 'number',
                  format: 'float',
                  example: -122.4094,
                },
              },
            },
            packageDetails: {
              type: 'object',
              properties: {
                weight: {
                  type: 'number',
                  description: 'Package weight in kg',
                  example: 2.5,
                },
                dimensions: {
                  type: 'object',
                  properties: {
                    length: {
                      type: 'number',
                      description: 'Length in cm',
                      example: 30,
                    },
                    width: {
                      type: 'number',
                      description: 'Width in cm',
                      example: 20,
                    },
                    height: {
                      type: 'number',
                      description: 'Height in cm',
                      example: 15,
                    },
                  },
                },
                contentDescription: {
                  type: 'string',
                  description: 'Description of package contents',
                  example: 'Electronics - Laptop',
                },
              },
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
              description: 'Current status of the delivery',
              example: 'pending',
            },
            estimatedDeliveryTime: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated delivery time',
              example: '2023-10-01T15:00:00.000Z',
            },
            actualDeliveryTime: {
              type: 'string',
              format: 'date-time',
              description: 'Actual delivery time',
              example: '2023-10-01T14:45:00.000Z',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Delivery price in USD',
              example: 25.50,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the request was created',
              example: '2023-10-01T12:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the request was last updated',
              example: '2023-10-01T12:00:00.000Z',
            },
          },
        },
        DeliveryRequestInput: {
          type: 'object',
          required: ['pickupAddress', 'deliveryAddress', 'pickupCoordinates', 'deliveryCoordinates', 'packageDescription', 'packageWeight', 'packageValue'],
          properties: {
            pickupAddress: {
              type: 'string',
              description: 'Pickup address',
              example: '123 Main St, San Francisco, CA 94102',
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address',
              example: '456 Oak Ave, San Francisco, CA 94103',
            },
            pickupCoordinates: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: {
                  type: 'number',
                  format: 'float',
                  example: 37.7749,
                },
                longitude: {
                  type: 'number',
                  format: 'float',
                  example: -122.4194,
                },
              },
            },
            deliveryCoordinates: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: {
                  type: 'number',
                  format: 'float',
                  example: 37.7849,
                },
                longitude: {
                  type: 'number',
                  format: 'float',
                  example: -122.4094,
                },
              },
            },
            packageDescription: {
              type: 'string',
              description: 'Description of the package',
              example: 'Electronics - Laptop',
            },
            packageWeight: {
              type: 'number',
              format: 'float',
              description: 'Package weight in kg',
              example: 2.5,
            },
            packageValue: {
              type: 'number',
              format: 'float',
              description: 'Declared value of the package in USD',
              example: 1500.00,
            },
            estimatedDeliveryTime: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated delivery time',
              example: '2023-10-01T15:00:00.000Z',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Delivery price in USD',
              example: 25.50,
            },
          },
        },
        StatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
              description: 'New status for the delivery',
              example: 'picked_up',
            },
          },
        },
        AssignDriver: {
          type: 'object',
          required: ['driverId'],
          properties: {
            driverId: {
              type: 'string',
              description: 'ID of the driver to assign',
              example: '60d5ec49f1b2c8b1f8e4e1a2',
            },
          },
        },
        // Common Response Schemas
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid credentials',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
              example: 'The provided email or password is incorrect',
            },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Drivers',
        description: 'Driver management and operations endpoints',
      },
      {
        name: 'Delivery Requests',
        description: 'Delivery request management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
