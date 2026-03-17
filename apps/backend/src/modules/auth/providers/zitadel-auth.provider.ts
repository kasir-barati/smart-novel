import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';

import {
  type AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from '../auth.module-definition';
import {
  type IAuthProvider,
  IAuthUser,
  ZitadelJwtPayload,
  ZitadelOpenIdConfigurationResponse,
} from '../interfaces';

/**
 * @description
 * Validates access tokens using ZITADEL's JWKS-based JWT verification.
 *
 * Standard JWTs (issued by Zitadel to the frontend via OIDC Authorization Code + PKCE)
 * are verified using the JWKS discovered from the OIDC well-known endpoint.
 *
 * To switch to another IdP, create a new class implementing `IAuthProvider` and swap `useClass` in `AuthModule`.
 */
@Injectable()
export class ZitadelAuthProvider
  implements IAuthProvider, OnModuleInit
{
  private jwks!: ReturnType<typeof createRemoteJWKSet>;
  private issuer!: string;
  private zitadelBaseUrl!: string;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.zitadelBaseUrl =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
    await this.discoverOidcConfig();
  }

  async validateToken(token: string): Promise<IAuthUser> {
    return this.validateJwt(token);
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
   * Normalize ZITADEL-specific token claims into the provider-agnostic IAuthUser shape.
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
