import type { Request, Response, NextFunction } from 'express';
import { verify_jwt } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const auth_check = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify_jwt(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const get_and_decode_token = (req: Request) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify_jwt(token);
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
};
