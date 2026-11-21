import { Router } from 'express';
import { Complaint } from '../models/Complaint';
import { authenticate } from '../middleware/authMiddleware';
import { StorageService } from '../services/storageService';
import { AppError, asyncHandler } from '../utils/errors';

const router = Router();

/** Voice recordings are private: only the reporter and administrators may play them. */
router.get(
  '/audio/:filename',
  authenticate,
  asyncHandler(async (req, res) => {
    const filename = String(req.params.filename);
    const file = StorageService.audioPath(filename);
    const complaint = file ? await Complaint.findOne({ 'media.filename': filename }).select('reporterId media') : null;
    if (!file || !complaint) throw new AppError(404, 'NOT_FOUND', 'File not found.');
    const isOwner = String(complaint.reporterId) === String(req.user!._id);
    if (!isOwner && req.user!.role !== 'admin') throw new AppError(403, 'FORBIDDEN', 'You do not have permission to do this.');
    res.setHeader('Cache-Control', 'private, no-store');
    res.type(complaint.media.find((m) => m.filename === filename)?.mime ?? 'application/octet-stream');
    res.sendFile(file);
  }),
);

export default router;
