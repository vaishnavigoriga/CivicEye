export interface DetectedFile {
  kind: 'image' | 'audio';
  mime: string;
  ext: string;
}

const startsWith = (b: Buffer, bytes: number[], offset = 0) => bytes.every((v, i) => b[offset + i] === v);
const ascii = (b: Buffer, s: string, offset: number) => b.subarray(offset, offset + s.length).toString('latin1') === s;

/**
 * Identify a file by its content (magic bytes), not by the client-supplied name or MIME type.
 * Returns null for anything that is not an accepted image or audio format.
 */
export const detectFileType = (b: Buffer): DetectedFile | null => {
  if (b.length < 12) return null;
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { kind: 'image', mime: 'image/jpeg', ext: '.jpg' };
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', mime: 'image/png', ext: '.png' };
  if (ascii(b, 'RIFF', 0) && ascii(b, 'WEBP', 8)) return { kind: 'image', mime: 'image/webp', ext: '.webp' };
  if (ascii(b, 'RIFF', 0) && ascii(b, 'WAVE', 8)) return { kind: 'audio', mime: 'audio/wav', ext: '.wav' };
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'audio', mime: 'audio/webm', ext: '.webm' };
  if (ascii(b, 'OggS', 0)) return { kind: 'audio', mime: 'audio/ogg', ext: '.ogg' };
  if (ascii(b, 'ftyp', 4)) return { kind: 'audio', mime: 'audio/mp4', ext: '.m4a' };
  if (ascii(b, 'ID3', 0) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { kind: 'audio', mime: 'audio/mpeg', ext: '.mp3' };
  return null;
};
