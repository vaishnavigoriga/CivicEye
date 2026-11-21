import { Request, Response } from 'express';
import { TranscriptionService } from '../services/transcriptionService';
import { StorageService } from '../services/storageService';
import { sendSuccess, sendError } from '../utils/responseHelper';

export class TranscriptionController {
  static async transcribeAudio(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'Audio file is required', 400);
        return;
      }

      const fileUrl = StorageService.getFileUrl(req.file, 'audio');
      const result = await TranscriptionService.transcribeAudio(req.file.path, req.file.mimetype);

      sendSuccess(res, {
        ...result,
        audioUrl: fileUrl,
      });
    } catch (err: any) {
      sendError(res, err.message || 'Audio processing failed', 500);
    }
  }
}
