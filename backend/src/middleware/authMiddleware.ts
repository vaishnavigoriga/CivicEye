import { NextFunction, Request, RequestHandler, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../utils/errors';
import { User } from '../models/User';

const loadUser = async (req: Request) => {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const { id } = verifyToken(token);
    const user = await User.findById(id);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
};

/** Requires a valid session. The user (and role) is re-read from the database on every request. */
export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  req.user = user;
  next();
});

/** Attaches req.user when a valid session exists but never blocks. */
export const optionalAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const user = await loadUser(req);
  if (user) req.user = user;
  next();
});

export const requireRole =
  (role: 'citizen' | 'admin') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.'));
    if (req.user.role !== role) return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this.'));
    next();
  };
