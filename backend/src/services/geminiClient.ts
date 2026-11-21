import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Thin wrapper over the official @google/genai SDK using the documented Interactions API (v1beta).
 * The API key is read from the server environment only. It is never logged, returned or sent to the browser.
 */
export interface GeminiLike {
  interactions: { create(args: Record<string, unknown>): Promise<any> };
}

let client: GeminiLike | null = null;

export const isGeminiConfigured = (): boolean => ENV.GEMINI_API_KEY.trim().length > 0;

const getClient = (): GeminiLike => {
  if (!client) client = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1beta' } }) as unknown as GeminiLike;
  return client;
};

/** Test hook: inject a fake client (pass null to restore the real one). */
export const setGeminiClientForTests = (fake: GeminiLike | null): void => {
  client = fake;
};

export class GeminiError extends Error {
  constructor(message: string, public kind: 'timeout' | 'api' | 'invalid') {
    super(message);
  }
}

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new GeminiError(`Gemini call timed out after ${ms} ms`, 'timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

/** Never leak keys or raw provider payloads into logs or errors. */
const scrub = (e: unknown): string => String((e as any)?.message ?? e).replace(/AQ\.[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{20,}/g, '[redacted]').slice(0, 200);

/** Calls interactions.create with a timeout and one retry for timeouts / transient errors. */
export const interact = async (args: Record<string, unknown>, timeoutMs = ENV.GEMINI_TIMEOUT_MS): Promise<any> => {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await withTimeout(getClient().interactions.create(args), timeoutMs);
    } catch (e: any) {
      lastErr = e;
      const status = e?.status ?? e?.code;
      const transient = e instanceof GeminiError || status === 429 || (typeof status === 'number' && status >= 500);
      logger.warn(`Gemini call failed (attempt ${attempt}/2, model ${String(args.model)}): ${scrub(e)}`);
      if (!transient) break;
    }
  }
  throw new GeminiError(scrub(lastErr), lastErr instanceof GeminiError ? lastErr.kind : 'api');
};
