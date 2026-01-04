/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and brute-force attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 * Prevents brute-force attacks on login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Count all requests, even successful ones
});

/**
 * File upload rate limiter
 * Limits: 10 uploads per hour per IP
 * Prevents abuse of file upload endpoints
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too Many Requests',
    message: 'Too many file uploads from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin API rate limiter
 * Limits: 200 requests per 15 minutes per IP
 * Higher limit for admin operations
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin users
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  adminLimiter
};

