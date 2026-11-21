import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Ensure upload folders exist
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const DIRS = ['images', 'audio', 'evidence'].map((dir) => path.join(UPLOAD_ROOT, dir));
DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Allowed MIME types and extensions
const ALLOWED_IMAGES = {
  mimes: ['image/jpeg', 'image/png', 'image/webp'],
  exts: ['.jpg', '.jpeg', '.png', '.webp'],
};

const ALLOWED_AUDIO = {
  mimes: ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg'],
  exts: ['.webm', '.ogg', '.wav', '.mp4', '.mp3'],
};

// Forbidden executable extensions
const EXECUTABLE_EXTS = ['.exe', '.bat', '.sh', '.php', '.phtml', '.js', '.ts', '.py', '.cmd', '.vbs', '.msi'];

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'images';
    if (file.fieldname === 'audio' || file.mimetype.startsWith('audio/')) {
      folder = 'audio';
    } else if (file.fieldname === 'evidence') {
      folder = 'evidence';
    }
    cb(null, path.join(UPLOAD_ROOT, folder));
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Safety check: Discard original name completely, assign random UUID
    const safeFilename = `${uuidv4()}${ext || ''}`;
    cb(null, safeFilename);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Strict check: Block any executable extension immediately
  if (EXECUTABLE_EXTS.includes(ext)) {
    return cb(new Error('Executable file uploads are strictly forbidden.'));
  }

  const isImageField = file.fieldname === 'image' || file.fieldname === 'evidence' || file.fieldname === 'media';
  const isAudioField = file.fieldname === 'audio';

  if (isImageField) {
    if (ALLOWED_IMAGES.mimes.includes(file.mimetype) && ALLOWED_IMAGES.exts.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP.'));
  }

  if (isAudioField) {
    if (ALLOWED_AUDIO.mimes.includes(file.mimetype) || ALLOWED_AUDIO.exts.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid audio format. Allowed: WEBM, OGG, WAV, MP4, MP3.'));
  }

  // General fallback for multi-uploads
  if (
    ALLOWED_IMAGES.mimes.includes(file.mimetype) ||
    ALLOWED_AUDIO.mimes.includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  return cb(new Error(`Unsupported file type: ${file.mimetype}`));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});
