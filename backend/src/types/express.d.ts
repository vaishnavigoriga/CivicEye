import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      /** Set by authenticate / optionalAuth. Always loaded from the database, never trusted from the token. */
      user?: IUser;
    }
  }
}

export {};
