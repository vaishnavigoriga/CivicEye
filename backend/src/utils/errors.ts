import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_EXISTS'
  | 'RATE_LIMITED'
  | 'FILE_INVALID'
  | 'FILE_TOO_LARGE'
  | 'LOCATION_OUTSIDE_REGION'
  | 'CONFLICT'
  | 'AI_UNAVAILABLE'
  | 'INTERNAL';

/** Error whose message is safe to show to clients. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Validate and replace req.body / req.query using a Zod schema. */
export const validate =
  (schema: ZodSchema, source: 'body' | 'query' = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) fields[issue.path.join('.') || '_'] = issue.message;
      return next(new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', fields));
    }
    // Express 4 allows reassigning both.
    (req as any)[source] = result.data;
    next();
  };
