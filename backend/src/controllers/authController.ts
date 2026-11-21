import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ENV } from '../config/env';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferredLanguage: z.enum(['en', 'te', 'hi']).default('en'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);

      const existing = await User.findOne({ email: validated.email.toLowerCase() });
      if (existing) {
        sendError(res, 'User with this email already exists', 409);
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(validated.password, salt);

      const user = await User.create({
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: 'citizen',
        preferredLanguage: validated.preferredLanguage,
        phone: validated.phone,
      });

      const token = signToken({
        id: (user._id as any).toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      });

      setAuthCookie(res, token);

      sendSuccess(
        res,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
          },
        },
        'Registration successful',
        201
      );
    } catch (err: any) {
      if (err.errors) {
        sendError(res, 'Validation error', 400, err.errors);
        return;
      }
      sendError(res, err.message || 'Registration failed', 500);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);

      const user = await User.findOne({ email: validated.email.toLowerCase() });
      if (!user) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      const token = signToken({
        id: (user._id as any).toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      });

      setAuthCookie(res, token);

      sendSuccess(
        res,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
          },
        },
        'Login successful'
      );
    } catch (err: any) {
      if (err.errors) {
        sendError(res, 'Validation error', 400, err.errors);
        return;
      }
      sendError(res, err.message || 'Login failed', 500);
    }
  }

  static async demoLogin(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.body; // 'citizen' or 'admin'
      const targetEmail = role === 'admin' ? 'admin@civiceye.demo' : 'citizen@civiceye.demo';

      let user = await User.findOne({ email: targetEmail });
      if (!user) {
        // Auto-seed on demo login if user doesn't exist yet
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(role === 'admin' ? 'admin1234' : 'demo1234', salt);
        user = await User.create({
          name: role === 'admin' ? 'Demo Administrator' : 'Demo Citizen (Ramesh Kumar)',
          email: targetEmail,
          passwordHash,
          role: role === 'admin' ? 'admin' : 'citizen',
          preferredLanguage: 'en',
          phone: '9876543210',
        });
      }

      const token = signToken({
        id: (user._id as any).toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      });

      setAuthCookie(res, token);

      sendSuccess(
        res,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
          },
        },
        `Logged in as ${role}`
      );
    } catch (err: any) {
      sendError(res, err.message || 'Demo login failed', 500);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token', {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    sendSuccess(res, null, 'Logged out successfully');
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const { name, phone, preferredLanguage, currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      if (name && typeof name === 'string' && name.trim().length >= 2) {
        user.name = name.trim();
      }
      if (phone !== undefined) {
        user.phone = typeof phone === 'string' ? phone.trim() : '';
      }
      if (preferredLanguage && ['en', 'te', 'hi'].includes(preferredLanguage)) {
        user.preferredLanguage = preferredLanguage;
      }

      // Optional secure password change
      if (newPassword && newPassword.length >= 6) {
        if (!currentPassword) {
          sendError(res, 'Current password is required to set a new password', 400);
          return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          sendError(res, 'Current password does not match', 400);
          return;
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await user.save();

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            preferredLanguage: user.preferredLanguage,
          },
        },
        'Profile updated successfully'
      );
    } catch (err: any) {
      sendError(res, err.message || 'Failed to update profile', 500);
    }
  }
}
