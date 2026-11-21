import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { ENV } from '../config/env';
import { AppError } from '../utils/errors';
import { DetectedFile, detectFileType } from '../utils/fileType';

/** Files are held in memory, validated by content, and only then written to disk by StorageService. */
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ENV.MAX_UPLOAD_BYTES, files: 2 },
});

export const uploadFields = (fields: { name: string; kind: 'image' | 'audio' }[]) => uploader.fields(fields.map((f) => ({ name: f.name, maxCount: 1 })));
export const uploadSingle = (name: string) => uploader.single(name);

export interface ValidatedUpload {
  buffer: Buffer;
  detected: DetectedFile;
}

/** Reads a multer file and verifies it really is the expected kind of file. */
export const validateUpload = (file: Express.Multer.File | undefined, kind: 'image' | 'audio'): ValidatedUpload | null => {
  if (!file) return null;
  const detected = detectFileType(file.buffer);
  if (!detected || detected.kind !== kind) {
    throw new AppError(400, 'FILE_INVALID', kind === 'image' ? 'The image must be a JPG, PNG or WebP file.' : 'The audio must be a WebM, OGG, WAV, MP3 or MP4 file.');
  }
  return { buffer: file.buffer, detected };
};

export const getFile = (req: Request, name: string): Express.Multer.File | undefined => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[name]?.[0] ?? req.file;
};

/** Guard so a route that requires a file fails clearly when none was sent. */
export const requireFile = (name: string) => (req: Request, _res: Response, next: NextFunction) => {
  if (!getFile(req, name)) return next(new AppError(400, 'FILE_INVALID', 'A file is required.'));
  next();
};
