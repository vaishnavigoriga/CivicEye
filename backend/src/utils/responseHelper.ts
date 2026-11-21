import { Response } from 'express';

/** Success envelope: { success: true, data, message? } */
export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

/** Error envelope: { success: false, error: { code, message, fields? } } */
export const sendError = (res: Response, status: number, code: string, message: string, fields?: Record<string, string>) =>
  res.status(status).json({ success: false, error: { code, message, fields } });
