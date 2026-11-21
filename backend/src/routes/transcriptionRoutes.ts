import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcriptionController';
import { upload } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Citizen voice transcription route
router.post('/audio', authenticate, upload.single('audio'), TranscriptionController.transcribeAudio);

export default router;
