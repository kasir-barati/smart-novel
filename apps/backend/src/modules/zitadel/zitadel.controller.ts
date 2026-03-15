import type { Request, Response } from 'express';

import { All, Controller, Next, Req, Res } from '@nestjs/common';

import { Public } from './decorators';
import { ZitadelMiddleware } from './zitadel.middleware';

/**
 * Controller that handles all Auth.js routes.
 * Delegates all requests to AuthMiddleware for processing.
 */
@Controller('auth')
@Public()
export class ZitadelController {
  constructor(private readonly authMiddleware: ZitadelMiddleware) {
    //
  }

  /**
   * Handles all Auth.js routes including
   * - GET/POST /auth/signin
   * - GET /auth/callback/:provider
   * - POST /auth/signout
   * - GET /auth/session
   * - etc.
   */
  @All('*path')
  async handleAuthRoutes(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: () => void,
  ): Promise<void> {
    return this.authMiddleware.use(req, res, next);
  }
}
