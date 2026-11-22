import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const num = (def: string) => z.string().default(def).transform((v) => Number(v));
const bool = (def: string) => z.string().default(def).transform((v) => v.toLowerCase() === 'true');

const KNOWN_WEAK_SECRETS = ['civiceye_super_secret_jwt_key_2026_dev_mode', 'change_me', 'secret'];

const envSchema = z.object({
  PORT: num('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  TRUST_PROXY: bool('false'),
  /** Serve frontend/dist from this server. Unset = on in production, off otherwise. */
  SERVE_FRONTEND: z.string().default('').transform((v) => (v === '' ? undefined : v.toLowerCase() === 'true')),

  MONGO_URI: z.string().optional().default(''),
  /** Explicit opt-in to a throw-away in-memory MongoDB (development and tests only). */
  USE_MEMORY_DB: bool('false'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),

  /** Optional first-administrator bootstrap. Created at startup if the email does not exist yet. */
  ADMIN_EMAIL: z.string().optional().default(''),
  ADMIN_PASSWORD: z.string().optional().default(''),
  ADMIN_NAME: z.string().default('CivicEye Administrator'),

  /** Opt-in demo data, always labelled DEMO. */
  SEED_DEMO_DATA: bool('false'),

  GEMINI_API_KEY: z.string().optional().default(''),
  /** Verified against the live API on 2026-11-21. Larger Flash models were far slower (30-60+ s) for this workload. */
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_TRANSCRIBE_MODEL: z.string().default('gemini-3.5-transcribe'),
  GEMINI_TTS_MODEL: z.string().default('gemini-3.8-flash-lite-tts'),
  GEMINI_TTS_VOICE: z.string().default('Kore'),
  GEMINI_TIMEOUT_MS: num('30000'),
  /**
   * When a configured Gemini call fails: false (default) = save the report with ai.status "failed" and no AI result;
   * true = fall back to the keyword-based simulated analysis, clearly labelled as simulated.
   */
  AI_DEMO_FALLBACK: bool('false'),

  // Prototype scoring model (weights should sum to 1.0)
  SCORING_WEIGHT_SAFETY: num('0.35'),
  SCORING_WEIGHT_AFFECTED: num('0.25'),
  SCORING_WEIGHT_EVIDENCE: num('0.20'),
  SCORING_WEIGHT_DURATION: num('0.20'),
  SCORING_DURATION_SATURATION_DAYS: num('30'),

  // Duplicate detection
  DUPLICATE_RADIUS_METRES: num('200'),
  DUPLICATE_LOOKBACK_DAYS: num('30'),
  DUPLICATE_SCORE_THRESHOLD: num('0.3'),

  // Rate limits (requests per window)
  RATE_LIMIT_GENERAL_MAX: num('300'),
  RATE_LIMIT_AUTH_MAX: num('10'),
  RATE_LIMIT_REGISTER_MAX: num('10'),
  RATE_LIMIT_SUBMIT_MAX: num('20'),
  RATE_LIMIT_AI_MAX: num('30'),

  MAX_UPLOAD_BYTES: num(String(10 * 1024 * 1024)),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment validation failed.');
}

export const ENV = parsed.data;

if (ENV.NODE_ENV === 'production') {
  if (ENV.JWT_SECRET.length < 32 || KNOWN_WEAK_SECRETS.includes(ENV.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters in production.');
  }
  if (ENV.USE_MEMORY_DB) {
    throw new Error('USE_MEMORY_DB must not be enabled in production.');
  }
} else if (KNOWN_WEAK_SECRETS.includes(ENV.JWT_SECRET) || ENV.JWT_SECRET.length < 32) {
  console.warn('[WARN] JWT_SECRET is short or a known default. Generate a random one before deploying.');
}

const weightSum =
  ENV.SCORING_WEIGHT_SAFETY + ENV.SCORING_WEIGHT_AFFECTED + ENV.SCORING_WEIGHT_EVIDENCE + ENV.SCORING_WEIGHT_DURATION;
if (Math.abs(weightSum - 1) > 0.01) {
  console.warn(`[WARN] Scoring weights sum to ${weightSum.toFixed(2)}, expected 1.0. They will be normalised.`);
}
