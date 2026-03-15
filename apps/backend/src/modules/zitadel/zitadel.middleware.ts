import type { Request, Response } from 'express';

import { Auth, setEnvDefaults } from '@auth/core';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';

import { HttpAdapter } from './adapters';
import { toHttpResponse, toWebRequest } from './utils';
import {
  type IZitadelModuleOptions,
  ZitadelModuleOptions,
} from './zitadel.module-definition';

/**
 * Middleware that intercepts requests to Auth.js routes and processes them through Auth.js core. Handles all authentication flows including sign-in, sign-out, callbacks, and session management.
 */
@Injectable()
export class ZitadelMiddleware implements NestMiddleware {
  private httpAdapter?: HttpAdapter;

  constructor(
    @Inject(ZitadelModuleOptions)
    private readonly options: IZitadelModuleOptions,
  ) {}

  async use(
    req: Request,
    res: Response,
    next: (error?: unknown) => void,
  ): Promise<void> {
    if (!this.httpAdapter) {
      this.httpAdapter = new HttpAdapter();
    }

    const config = { ...this.options };
    setEnvDefaults(process.env, config);

    try {
      const webRequest = toWebRequest(req, this.httpAdapter);
      const webResponse = await Auth(webRequest, config);
      await toHttpResponse(webResponse, res, this.httpAdapter);
    } catch (error) {
      next(error);
    }
  }
}
