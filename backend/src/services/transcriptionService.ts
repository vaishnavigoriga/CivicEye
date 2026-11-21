import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

export interface TranscriptionResult {
  text: string | null;
  language: 'en' | 'te' | 'hi';
  source: 'gemini' | 'unavailable';
  message?: string;
}

const transcriptionSchema = z.object({
  text: z.string().min(1),
  language: z.enum(['en', 'te', 'hi']).default('en'),
});

export class TranscriptionService {
  /**
   * Transcribes voice audio into text using Gemini 1.5 Flash audio capability
   * If Gemini API is unavailable or fails, returns source: 'unavailable' honestly.
   */
  static async transcribeAudio(filePath: string, mimeType: string): Promise<TranscriptionResult> {
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY.trim() === '') {
      return {
        text: null,
        language: 'en',
        source: 'unavailable',
        message: 'Voice transcription service is currently unavailable without an active Gemini API key. Audio has been securely attached.',
      };
    }

    try {
      const audioBuffer = fs.readFileSync(filePath);
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Transcribe this citizen civic grievance audio accurately.
The speaker may speak in English, Telugu, or Hindi.
Return ONLY raw JSON with no markdown formatting:
{
  "text": "the verbatim transcription of the grievance",
  "language": "en" | "te" | "hi"
}`;

      const contents = [
        prompt,
        {
          inlineData: {
            data: audioBuffer.toString('base64'),
            mimeType: mimeType || 'audio/webm',
          },
        },
      ];

      // 10s timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transcription request timed out')), 10000)
      );

      const apiCall = model.generateContent(contents);
      const result: any = await Promise.race([apiCall, timeoutPromise]);
      const responseText = result.response.text();

      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = transcriptionSchema.parse(parsed);

      return {
        text: validated.text,
        language: validated.language,
        source: 'gemini',
      };
    } catch (err: any) {
      logger.warn(`Voice transcription error: ${err.message}`);
      return {
        text: null,
        language: 'en',
        source: 'unavailable',
        message: 'Voice transcription service encountered a temporary error. The audio has been attached for administrative review.',
      };
    }
  }
}
