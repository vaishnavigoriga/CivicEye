import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/responseHelper';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Read JWT from httpOnly cookie or Authorization header fallback
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    sendError(res, 'Invalid or expired session. Please login again.', 401);
  }
};

export const requireRole = (role: 'citizen' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (req.user.role !== role) {
      sendError(res, `Access denied. Requires '${role}' privileges.`, 403);
      return;
    }

    next();
  };
};
