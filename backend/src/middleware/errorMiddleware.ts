import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/responseHelper';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, 'NOT_FOUND', 'Resource not found.');
};

/** Central error handler. Only AppError messages reach the client; everything else is logged and masked. */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message, err.fields);
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 413, 'FILE_TOO_LARGE', 'The file is too large.');
    } else {
      sendError(res, 400, 'FILE_INVALID', 'The upload was not accepted.');
    }
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    sendError(res, 400, 'VALIDATION_ERROR', 'Malformed JSON body.');
    return;
  }
  if (err?.type === 'entity.too.large') {
    sendError(res, 413, 'FILE_TOO_LARGE', 'The request is too large.');
    return;
  }
  if (err?.name === 'CastError') {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found.');
    return;
  }
  if (err?.code === 11000) {
    sendError(res, 409, 'CONFLICT', 'This record already exists.');
    return;
  }

  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);
  sendError(res, 500, 'INTERNAL', 'Something went wrong. Please try again later.');
};
