import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth_check.js';
import type { UserRole } from '../types/roles.js';

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - No user found' });
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden - Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is a driver
 */
export const requireDriver = requireRole('driver');

/**
 * Middleware to check if user is a customer
 */
export const requireCustomer = requireRole('user');
