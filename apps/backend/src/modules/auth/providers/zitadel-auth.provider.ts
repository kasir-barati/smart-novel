import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as jose from 'jose';

import {
  AUTH_MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from '../auth.module-definition';
import { IAuthProvider, IAuthUser } from '../interfaces';

/**
 * @description ZITADEL implementation of IAuthProvider.
 * Validates JWTs using JWKS discovered from the OIDC well-known endpoint.
 *
 * To switch to another IdP, create a new class implementing IAuthProvider
 * and swap `useClass` in AuthModule.
 */
@Injectable()
export class ZitadelAuthProvider
  implements IAuthProvider, OnModuleInit
{
  private readonly logger = new Logger(ZitadelAuthProvider.name);
  private jwks!: ReturnType<typeof jose.createRemoteJWKSet>;
  private issuer!: string;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    // Use the internal URL (Docker network) for fetching discovery/JWKS,
    // but validate the JWT `iss` claim against the external/public issuer URL.
    const internalBase =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
    const discoveryUrl = `${internalBase}/.well-known/openid-configuration`;

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

      const response = await fetch(discoveryUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch OIDC discovery: ${response.status} ${response.statusText}`,
        );
      }

      const config = (await response.json()) as {
        issuer: string;
        jwks_uri: string;
      };

      // The JWT issuer claim matches the external URL, not the internal one
      this.issuer = config.issuer;

      // Rewrite the JWKS URI to use the internal base if needed
      let jwksUri = config.jwks_uri;

      if (this.options.issuerInternalUrl) {
        const externalOrigin = new URL(this.options.issuerUrl).origin;
        const internalOrigin = new URL(internalBase).origin;
        jwksUri = jwksUri.replace(externalOrigin, internalOrigin);
      }

      this.jwks = jose.createRemoteJWKSet(new URL(jwksUri));

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

    const { payload } = await jose.jwtVerify(token, this.jwks, {
      issuer: this.issuer,
    });

    return this.normalizeTokenClaims(
      payload as Record<string, unknown>,
    );
  }

  /**
   * @description Normalize ZITADEL-specific token claims into
   * the provider-agnostic IAuthUser shape.
   *
   * ZITADEL claim references:
   * - `urn:zitadel:iam:org:id` → orgId
   * - `urn:zitadel:iam:org:project:roles` → roles object
   * - `urn:zitadel:iam:user:metadata` → user metadata (base64-encoded values)
   */
  private normalizeTokenClaims(
    claims: Record<string, unknown>,
  ): IAuthUser {
    const sub = claims.sub as string;
    const email = (claims.email as string) ?? '';
    const emailVerified = (claims.email_verified as boolean) ?? false;

    // ZITADEL org ID
    const orgId =
      (claims['urn:zitadel:iam:org:id'] as string) ?? undefined;

    // ZITADEL roles: { "role_name": { "orgId": "orgDomain" } }
    const rolesObj =
      (claims['urn:zitadel:iam:org:project:roles'] as Record<
        string,
        unknown
      >) ?? {};
    const roles = Object.keys(rolesObj);

    // ZITADEL metadata: { "key": "base64value" }
    const rawMetadata =
      (claims['urn:zitadel:iam:user:metadata'] as Record<
        string,
        string
      >) ?? {};
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
