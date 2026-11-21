import path from 'path';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

export interface SavedFileResult {
  url: string;
  filename: string;
  mimeType: string;
}

export class StorageService {
  /**
   * Return accessible URL for uploaded file (Local /uploads static path vs Cloud CDN)
   */
  static getFileUrl(file: Express.Multer.File, subFolder: 'images' | 'audio' | 'evidence'): string {
    if (ENV.STORAGE_DRIVER === 'cloudinary' && ENV.CLOUDINARY_URL) {
      // In production with Cloudinary configured
      logger.info(`Cloudinary driver selected for ${file.filename}`);
      return `/uploads/${subFolder}/${file.filename}`;
    }

    // Default Local development: served via express.static('/uploads')
    return `/uploads/${subFolder}/${file.filename}`;
  }
}
