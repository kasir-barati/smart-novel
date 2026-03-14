import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';
import { existsSync, readFileSync } from 'node:fs';

import {
  AUTH_MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from '../auth.module-definition';
import {
  IAuthProvider,
  IAuthUser,
  ZitadelJwtPayload,
  ZitadelOpenIdConfigurationResponse,
} from '../interfaces';

/**
 * @description
 * Validates access tokens using either ZITADEL's Session API (for session-based tokens)
 * or JWKS-based JWT verification (for standard OIDC tokens).
 *
 * Session tokens are base64-encoded `sessionId:sessionToken` pairs created by `AuthService.login()`.
 * Standard JWTs are verified using the JWKS discovered from the OIDC well-known endpoint.
 *
 * To switch to another IdP, create a new class implementing `IAuthProvider` and swap `useClass` in `AuthModule`.
 */
@Injectable()
export class ZitadelAuthProvider
  implements IAuthProvider, OnModuleInit
{
  private jwks!: ReturnType<typeof createRemoteJWKSet>;
  private issuer!: string;
  private resolvedPat!: string;
  private zitadelBaseUrl!: string;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.zitadelBaseUrl =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
    this.resolvePat();
    await this.discoverOidcConfig();
  }

  async validateToken(token: string): Promise<IAuthUser> {
    // Try session-based validation first (base64-encoded sessionId:sessionToken)
    const sessionCredentials = this.parseSessionToken(token);

    if (sessionCredentials) {
      return this.validateSession(
        sessionCredentials.sessionId,
        sessionCredentials.sessionToken,
      );
    }

    // Fall back to JWT validation for standard OIDC tokens
    return this.validateJwt(token);
  }

  /**
   * @description
   * Try to parse a base64-encoded `sessionId:sessionToken` pair.
   * Returns null if the token is not a valid session token format.
   */
  private parseSessionToken(
    token: string,
  ): { sessionId: string; sessionToken: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const colonIndex = decoded.indexOf(':');

      if (colonIndex === -1) {
        return null;
      }

      const sessionId = decoded.substring(0, colonIndex);
      const sessionToken = decoded.substring(colonIndex + 1);

      // Session IDs are numeric strings in ZITADEL
      if (!/^\d+$/.test(sessionId) || !sessionToken) {
        return null;
      }

      return { sessionId, sessionToken };
    } catch {
      return null;
    }
  }

  /**
   * @description
   * Validate a session by calling ZITADEL's Session API.
   * The session token is passed as the Authorization bearer token.
   */
  private async validateSession(
    sessionId: string,
    sessionToken: string,
  ): Promise<IAuthUser> {
    if (!this.resolvedPat) {
      this.resolvePat();
    }

    if (!this.resolvedPat) {
      throw new Error(
        'ZITADEL PAT is not configured. Cannot validate session tokens.',
      );
    }

    const sessionUrl = urlBuilder(
      this.zitadelBaseUrl,
      'v2',
      'sessions',
      sessionId,
    );

    try {
      const { data } = await axios.get<ZitadelSessionDetailResponse>(
        sessionUrl,
        {
          headers: {
            Authorization: `Bearer ${this.resolvedPat}`,
            'x-zitadel-session-token': sessionToken,
          },
        },
      );

      const session = data.session;

      if (!session?.factors?.user) {
        throw new Error('Session has no authenticated user');
      }

      const user = session.factors.user;

      return {
        sub: user.id,
        email: user.loginName ?? '',
        emailVerified: true,
        orgId: user.organizationId ?? undefined,
        roles: [],
        metadata: {},
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(
          `Session validation failed for ${sessionId}: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * @description
   * Validate a standard JWT using JWKS.
   */
  private async validateJwt(token: string): Promise<IAuthUser> {
    // Lazy-init if discovery failed at startup
    if (!this.jwks) {
      await this.discoverOidcConfig();
    }

    if (!this.jwks) {
      throw new Error(
        'OIDC provider is not available. Could not discover JWKS.',
      );
    }

    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
    });

    return this.normalizeTokenClaims(payload);
  }

  /**
   * @description
   * Discover the OIDC configuration (issuer, JWKS URI) from the well-known endpoint.
   */
  private async discoverOidcConfig(): Promise<void> {
    const internalBase =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
    const discoveryUrl = urlBuilder(
      internalBase,
      '.well-known',
      'openid-configuration',
    );

    this.logger.log(
      `Discovering OIDC configuration from ${discoveryUrl}`,
    );

    try {
      const { data } =
        await axios.get<ZitadelOpenIdConfigurationResponse>(
          discoveryUrl,
        );
      // The JWT issuer claim matches the external URL, not the internal one
      this.issuer = data.issuer;
      // Rewrite the JWKS URI to use the internal base if needed
      let jwksUri = data.jwks_uri;

      if (this.options.issuerInternalUrl) {
        const externalOrigin = new URL(this.options.issuerUrl).origin;
        const internalOrigin = new URL(internalBase).origin;

        jwksUri = jwksUri.replace(externalOrigin, internalOrigin);
      }

      this.jwks = createRemoteJWKSet(new URL(jwksUri));

      this.logger.log(
        `OIDC discovery complete. Issuer: ${this.issuer}, JWKS: ${jwksUri}`,
      );
    } catch (error) {
      this.logger.warn(
        `OIDC discovery failed (will retry on first token validation): ${error}`,
      );
    }
  }

  /**
   * @description
   * Resolve the service account PAT from either the module options or a file on disk.
   */
  private resolvePat(): void {
    if (this.options.pat) {
      this.resolvedPat = this.options.pat;
      return;
    }

    if (this.options.patFile) {
      if (existsSync(this.options.patFile)) {
        this.resolvedPat = readFileSync(
          this.options.patFile,
          'utf-8',
        ).trim();
        return;
      }
    }
  }

  /**
   * @description
   * Normalize ZITADEL-specific token claims into the provider-agnostic IAuthUser shape.
   *
   * ZITADEL claim references:
   * - `` => user metadata (base64-encoded values)
   */
  private normalizeTokenClaims(claims: ZitadelJwtPayload): IAuthUser {
    this.logger.debug('='.repeat(80));
    this.logger.debug(JSON.stringify(claims, null, 2));
    this.logger.debug('='.repeat(80));

    const sub = claims.sub as string;
    const email = claims.email ?? '';
    const emailVerified = claims.email_verified ?? false;
    const orgId = claims['urn:zitadel:iam:org:id'] ?? undefined;
    const rolesObj =
      claims['urn:zitadel:iam:org:project:roles'] ?? {};
    const roles = Object.keys(rolesObj);
    const rawMetadata = claims['urn:zitadel:iam:user:metadata'] ?? {};
    const metadata: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawMetadata)) {
      try {
        metadata[key] = Buffer.from(value, 'base64').toString(
          'utf-8',
        );
      } catch {
        metadata[key] = value;
      }
    }

    return {
      sub,
      email,
      emailVerified,
      orgId,
      roles,
      metadata,
    };
  }
}

interface ZitadelSessionDetailResponse {
  session: {
    id: string;
    creationDate: string;
    changeDate: string;
    sequence: string;
    factors: {
      user: {
        id: string;
        loginName: string;
        displayName: string;
        organizationId?: string;
      };
      password?: {
        verifiedAt: string;
      };
    };
    expirationDate?: string;
  };
}
