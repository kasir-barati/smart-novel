import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';

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
 * Validates JWTs using JWKS discovered from the OIDC well-known endpoint.
 *
 * To switch to another IdP, create a new class implementing `IAuthProvider` and swap `useClass` in `AuthModule`.
 */
@Injectable()
export class ZitadelAuthProvider
  implements IAuthProvider, OnModuleInit
{
  private jwks!: ReturnType<typeof createRemoteJWKSet>;
  private issuer!: string;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    // FIXME: Use the internal URL (Docker network) for fetching discovery/JWKS, but validate the JWT `iss` claim against the external/public issuer URL.
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
      // When using an internal URL, set the Host header to the external domain
      // so ZITADEL routes the request to the correct virtual instance.
      const headers: Record<string, string> = {};

      if (this.options.issuerInternalUrl) {
        const externalHost = new URL(this.options.issuerUrl).host;
        headers['Host'] = externalHost;
      }

      const { data } =
        await axios.get<ZitadelOpenIdConfigurationResponse>(
          discoveryUrl,
          { headers },
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

  async validateToken(token: string): Promise<IAuthUser> {
    // Lazy-init if discovery failed at startup
    if (!this.jwks) {
      await this.onModuleInit();
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
