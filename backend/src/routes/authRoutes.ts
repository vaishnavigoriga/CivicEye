import { Router } from 'express';
import { login, loginSchema, logout, me, profileSchema, register, registerSchema, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authLimiter, registerLimiter } from '../middleware/rateLimit';
import { validate } from '../utils/errors';

const router = Router();
router.post('/register', registerLimiter, authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(profileSchema), updateProfile);
export default router;
