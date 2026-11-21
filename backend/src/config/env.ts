import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  MONGO_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  GEMINI_API_KEY: z.string().optional().default(''),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_URL: z.string().optional(),
  SEVERITY_WEIGHT_AI: z.string().default('0.40').transform((v) => parseFloat(v)),
  SEVERITY_WEIGHT_UPVOTES: z.string().default('0.25').transform((v) => parseFloat(v)),
  SEVERITY_WEIGHT_SAFETY: z.string().default('0.20').transform((v) => parseFloat(v)),
  SEVERITY_WEIGHT_DURATION: z.string().default('0.15').transform((v) => parseFloat(v)),
  DUPLICATE_JACCARD_THRESHOLD: z.string().default('0.35').transform((v) => parseFloat(v)),
  DUPLICATE_RADIUS_METRES: z.string().default('500').transform((v) => parseInt(v, 10)),
  DUPLICATE_LOOKBACK_DAYS: z.string().default('30').transform((v) => parseInt(v, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment validation failed.');
}

// Validate weights sum approximately to 1.0
const weightsSum =
  parsed.data.SEVERITY_WEIGHT_AI +
  parsed.data.SEVERITY_WEIGHT_UPVOTES +
  parsed.data.SEVERITY_WEIGHT_SAFETY +
  parsed.data.SEVERITY_WEIGHT_DURATION;

if (Math.abs(weightsSum - 1.0) > 0.05) {
  console.warn(`Warning: Severity weights sum to ${weightsSum}, expected ~1.0. Normalizing.`);
}

export const ENV = parsed.data;
