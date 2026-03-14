import type { IAuthUser } from '../modules/auth/interfaces';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export {};
