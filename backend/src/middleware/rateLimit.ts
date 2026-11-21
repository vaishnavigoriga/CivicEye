import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';
import { sendError } from '../utils/responseHelper';

/** Creates a limiter that answers with the standard error envelope. */
export const createLimiter = (windowMs: number, max: number, keyBy?: (req: any) => string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyBy,
    handler: (_req, res) => {
      sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please wait a while and try again.');
    },
  });

const MINUTE = 60 * 1000;

export const generalLimiter = createLimiter(15 * MINUTE, ENV.RATE_LIMIT_GENERAL_MAX);
/** Login / register: keyed by IP (+ email when present) to slow password guessing. */
export const authLimiter = createLimiter(15 * MINUTE, ENV.RATE_LIMIT_AUTH_MAX, (req) => `${req.ip}|${String(req.body?.email ?? '').toLowerCase()}`);
export const submitLimiter = createLimiter(60 * MINUTE, ENV.RATE_LIMIT_SUBMIT_MAX, (req) => req.user?.id ?? req.ip);
/** Anything that calls the AI service (transcription, duplicate preview with text, analysis). */
export const aiLimiter = createLimiter(60 * MINUTE, ENV.RATE_LIMIT_AI_MAX, (req) => req.user?.id ?? req.ip);
