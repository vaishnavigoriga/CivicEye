import { Request, Response } from 'express';
import { z } from 'zod';
import { TranscriptionService } from '../services/transcriptionService';
import { speak } from '../services/speechService';
import { sendSuccess } from '../utils/responseHelper';
import { AppError, asyncHandler } from '../utils/errors';
import { getFile, validateUpload } from '../middleware/uploadMiddleware';

/**
 * POST /voice/transcribe. The audio is validated, sent for transcription and discarded: it is only stored
 * if the citizen later submits it with a complaint. If transcription is unavailable the response says so.
 */
export const transcribe = asyncHandler(async (req: Request, res: Response) => {
  const audio = validateUpload(getFile(req, 'audio'), 'audio');
  if (!audio) throw new AppError(400, 'FILE_INVALID', 'An audio file is required.');
  const result = await TranscriptionService.transcribe(audio.buffer, audio.detected.mime);
  sendSuccess(res, {
    available: result.source !== 'unavailable',
    noSpeech: !!result.noSpeech,
    text: result.text,
    language: result.language,
  });
});

export const speakSchema = z.object({ text: z.string().trim().min(1).max(500) });

/** POST /voice/speak: returns spoken audio (WAV) for a short text. */
export const speakText = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body as z.infer<typeof speakSchema>;
  const wav = await speak(text);
  res.setHeader('Cache-Control', 'private, no-store');
  res.type('audio/wav').send(wav);
});
