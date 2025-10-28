import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connect_db } from './config/db.js';
import type { env_types } from './types/env.js';
import { authRoutes } from './routes/auth.route.js';
import { userRoutes } from './routes/user.route.js';
import { driverRoutes } from './routes/driver.route.js';
import { deliveryRequestRoutes } from './routes/delivery_request.route.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const port: env_types['PORT'] = (process.env.PORT as env_types['PORT']) || "5444";

// Connect to MongoDB
connect_db();

// Routes
app.get('/', (req: Request, res: Response) => {
  return res.json({
    message: 'shiplink api working'
  });
});

app.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/delivery-requests', deliveryRequestRoutes);

// 404 Handler - Must be after all other routes
app.use('*', (req: Request, res: Response) => {
  return res.status(404).json({
    message: "Route not found",
    route: req.originalUrl,
    method: req.method
  });
});

// Start server
const portNumber = process.env.PORT ? parseInt(process.env.PORT) : 5444;
app.listen(portNumber, () => {
  console.log(`shiplink server running on http://localhost:${portNumber}`);
});
