import { Router } from 'express';
import { speakSchema, speakText, transcribe } from '../controllers/transcriptionController';
import { authenticate } from '../middleware/authMiddleware';
import { aiLimiter } from '../middleware/rateLimit';
import { uploadSingle } from '../middleware/uploadMiddleware';
import { validate } from '../utils/errors';

const router = Router();
router.post('/transcribe', authenticate, aiLimiter, uploadSingle('audio'), transcribe);
router.post('/speak', authenticate, aiLimiter, validate(speakSchema), speakText);
export default router;
