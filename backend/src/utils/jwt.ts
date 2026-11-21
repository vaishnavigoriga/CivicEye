import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface TokenPayload {
  id: string;
  role: 'citizen' | 'admin';
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
  return { id: decoded.id, role: decoded.role };
};
