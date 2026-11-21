import { ENV } from '../config/env';
import { interact, isGeminiConfigured } from './geminiClient';
import { logger } from '../utils/logger';

export interface TranscriptionResult {
  /** Transcribed text; '' when the audio contained no recognisable speech; null when unavailable. */
  text: string | null;
  language: 'en' | 'te' | 'hi';
  source: 'gemini' | 'unavailable';
  noSpeech?: boolean;
}

/** Script-based language guess for the transcript (Telugu / Devanagari / otherwise English). */
export const detectLanguage = (text: string): 'en' | 'te' | 'hi' => {
  const te = (text.match(/[ఀ-౿]/g) ?? []).length;
  const hi = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  if (te === 0 && hi === 0) return 'en';
  return te >= hi ? 'te' : 'hi';
};

/**
 * Speech to text with Gemini's dedicated transcription model (language auto-detected, 85+ languages).
 * If the service fails, the result is "unavailable" - a transcript is never fabricated.
 */
export class TranscriptionService {
  static async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    if (!isGeminiConfigured()) return { text: null, language: 'en', source: 'unavailable' };
    try {
      const res = await interact(
        {
          model: ENV.GEMINI_TRANSCRIBE_MODEL,
          input: [{ type: 'audio', data: audio.toString('base64'), mime_type: mimeType }],
          generation_config: { transcription_config: { language_codes: [] } },
        },
        Math.max(ENV.GEMINI_TIMEOUT_MS, 40_000),
      );
      const text = String(res.output_text ?? '').trim().slice(0, 2000);
      return { text, language: detectLanguage(text), source: 'gemini', noSpeech: text.length === 0 };
    } catch (err: any) {
      logger.warn(`Transcription unavailable: ${String(err?.message ?? err).slice(0, 200)}`);
      return { text: null, language: 'en', source: 'unavailable' };
    }
  }
}
