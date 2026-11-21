import { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, IUser } from '../models/User';
import { signToken } from '../utils/jwt';
import { sendSuccess } from '../utils/responseHelper';
import { AppError, asyncHandler } from '../utils/errors';
import { ENV } from '../config/env';
import { BCRYPT_COST } from '../services/seedService';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Enter a valid phone number').optional().or(z.literal('').transform(() => undefined)),
  preferredLanguage: z.enum(['en', 'te', 'hi']).default('en'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/).optional().or(z.literal('')),
    preferredLanguage: z.enum(['en', 'te', 'hi']).optional(),
    currentPassword: z.string().max(128).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, { message: 'Current password is required to set a new one', path: ['currentPassword'] });

const COOKIE: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

// Used to keep login timing similar whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

const publicUser = (u: IUser) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, phone: u.phone, preferredLanguage: u.preferredLanguage });

const startSession = (res: Response, user: IUser) => {
  const token = signToken({ id: String(user._id), role: user.role });
  res.cookie('token', token, { ...COOKIE, maxAge: 8 * 60 * 60 * 1000 });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof registerSchema>;
  if (await User.exists({ email: body.email })) throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
  // Role is always "citizen" here. Administrators are created only through the bootstrap script / env.
  const user = await User.create({
    name: body.name,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, BCRYPT_COST),
    role: 'citizen',
    phone: body.phone,
    preferredLanguage: body.preferredLanguage,
  });
  startSession(res, user);
  sendSuccess(res, { user: publicUser(user) }, 'Registered', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  startSession(res, user);
  sendSuccess(res, { user: publicUser(user) });
});

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token', COOKIE);
  sendSuccess(res, null, 'Logged out');
};

export const me = (req: Request, res: Response) => sendSuccess(res, { user: publicUser(req.user!) });

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof profileSchema>;
  const user = req.user!;
  if (body.name) user.name = body.name;
  if (body.phone !== undefined) user.phone = body.phone || undefined;
  if (body.preferredLanguage) user.preferredLanguage = body.preferredLanguage;
  if (body.newPassword) {
    if (!(await bcrypt.compare(body.currentPassword!, user.passwordHash))) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Current password is incorrect.', { currentPassword: 'Current password is incorrect.' });
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_COST);
  }
  await user.save();
  sendSuccess(res, { user: publicUser(user) }, 'Profile updated');
});
