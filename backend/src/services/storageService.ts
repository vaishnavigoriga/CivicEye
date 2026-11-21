import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DetectedFile } from '../utils/fileType';

export const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
/** Public: images and resolution evidence (served statically). */
export const PUBLIC_DIRS = ['images', 'evidence'] as const;
/** Private: voice recordings. Never served statically; delivered through an authorised route. */
export const PRIVATE_AUDIO_DIR = path.join(UPLOAD_ROOT, 'private', 'audio');

export type StoredFolder = 'images' | 'evidence' | 'audio';

for (const dir of [...PUBLIC_DIRS.map((d) => path.join(UPLOAD_ROOT, d)), PRIVATE_AUDIO_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

export interface StoredFile {
  filename: string;
  url: string;
  mime: string;
  size: number;
}

export class StorageService {
  /** Saves an already validated buffer under a random name (the client filename is never used). */
  static save(buffer: Buffer, detected: DetectedFile, folder: StoredFolder): StoredFile {
    const filename = `${uuidv4()}${detected.ext}`;
    const dir = folder === 'audio' ? PRIVATE_AUDIO_DIR : path.join(UPLOAD_ROOT, folder);
    fs.writeFileSync(path.join(dir, filename), buffer, { flag: 'wx' });
    const url = folder === 'audio' ? `/api/v1/media/audio/${filename}` : `/uploads/${folder}/${filename}`;
    return { filename, url, mime: detected.mime, size: buffer.length };
  }

  static audioPath(filename: string): string | null {
    // Only plain generated filenames are allowed (no path separators).
    if (!/^[0-9a-f-]{36}\.[a-z0-9]{3,4}$/.test(filename)) return null;
    const full = path.join(PRIVATE_AUDIO_DIR, filename);
    return fs.existsSync(full) ? full : null;
  }
}
