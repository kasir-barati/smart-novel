import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';
import { existsSync, readFileSync } from 'node:fs';

import type { Login } from '../types';

import {
  AUTH_MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from '../auth.module-definition';

/**
 * @description
 * Handles user authentication by verifying credentials via ZITADEL's Session API
 * and returning a session-based access token.
 *
 * Uses ZITADEL v2 Session API to verify username+password and returns an opaque
 * session token that can be validated via the session introspection endpoint.
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private resolvedClientId!: string;
  private resolvedPat!: string;
  private zitadelBaseUrl!: string;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.resolveClientId();
    this.resolvePat();
    this.zitadelBaseUrl =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
  }

  /**
   * @description
   * Exchange user credentials (email + password) for a session-based access token.
   *
   * Creates a ZITADEL session with user+password checks. Returns the session ID
   * and session token encoded as a single opaque access token (`sessionId:sessionToken`
   * base64-encoded).
   */
  async login(email: string, password: string): Promise<Login> {
    if (!this.resolvedPat) {
      this.resolvePat();
    }

    if (!this.resolvedPat) {
      throw new Error(
        'ZITADEL service account PAT is not configured. Set ZITADEL_PAT or provide patFile.',
      );
    }

    // ZITADEL expects username (not email) for loginName.
    // Our create-test-users.sh uses email.split('@')[0] as the username.
    const username = email.split('@')[0];

    try {
      const sessionUrl = urlBuilder(
        this.zitadelBaseUrl,
        'v2',
        'sessions',
      );

      this.logger.debug(
        `Attempting session-based login for username: ${username}`,
      );

      const { data } = await axios.post<ZitadelSessionResponse>(
        sessionUrl,
        {
          checks: {
            user: { loginName: username },
            password: { password },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.resolvedPat}`,
          },
        },
      );

      // Encode sessionId:sessionToken as a single opaque access token
      const accessToken = Buffer.from(
        `${data.sessionId}:${data.sessionToken}`,
      ).toString('base64');

      return {
        accessToken,
        // FIXME: ZITADEL sessions don't have a fixed expiry in the response;
        // use a reasonable default (1 hour)
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        this.logger.warn(
          `Session login failed for ${username}: HTTP ${status} - ${JSON.stringify(errorData)}`,
        );

        if (status === 400 || status === 401 || status === 403) {
          throw new UnauthorizedException(
            'Invalid email or password',
          );
        }
      }

      this.logger.error(`Login failed: ${error}`);
      throw new UnauthorizedException(
        'Authentication failed. Please try again.',
      );
    }
  }

  /**
   * @description
   * Resolve the OIDC client ID from either the module options or a file on disk.
   * In Docker, `init-zitadel-users` writes the auto-generated client ID to a shared volume.
   */
  private resolveClientId(): void {
    if (this.options.clientId) {
      this.resolvedClientId = this.options.clientId;
      this.logger.log('Using OIDC client ID from module options');
      return;
    }

    if (this.options.clientIdFile) {
      if (existsSync(this.options.clientIdFile)) {
        this.resolvedClientId = readFileSync(
          this.options.clientIdFile,
          'utf-8',
        ).trim();
        this.logger.log(
          `Loaded OIDC client ID from ${this.options.clientIdFile}`,
        );
        return;
      }

      this.logger.warn(
        `Client ID file not found: ${this.options.clientIdFile}`,
      );
    }

    this.logger.warn(
      'No OIDC client ID configured. Login will not work until clientId or clientIdFile is provided.',
    );
  }

  /**
   * @description
   * Resolve the service account PAT from either the module options or a file on disk.
   * In Docker, ZITADEL writes the PAT to a shared volume on first start.
   */
  private resolvePat(): void {
    if (this.options.pat) {
      this.resolvedPat = this.options.pat;
      this.logger.log('Using ZITADEL PAT from module options');
      return;
    }

    if (this.options.patFile) {
      if (existsSync(this.options.patFile)) {
        this.resolvedPat = readFileSync(
          this.options.patFile,
          'utf-8',
        ).trim();
        this.logger.log(
          `Loaded ZITADEL PAT from ${this.options.patFile}`,
        );
        return;
      }

      this.logger.warn(`PAT file not found: ${this.options.patFile}`);
    }

    this.logger.warn(
      'No ZITADEL PAT configured. Login will not work until pat or patFile is provided.',
    );
  }
}

interface ZitadelSessionResponse {
  details: {
    sequence: string;
    changeDate: string;
    resourceOwner: string;
  };
  sessionId: string;
  sessionToken: string;
}
