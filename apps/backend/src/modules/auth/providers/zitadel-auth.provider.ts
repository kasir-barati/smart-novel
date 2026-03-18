import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import {
  createLocalJWKSet,
  type JSONWebKeySet,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';

import { RedisService } from '../../redis';
import {
  type AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from '../auth.module-definition';
import {
  type IAuthProvider,
  IAuthUser,
  ZitadelJwtPayload,
  ZitadelOpenIdConfigurationResponse,
  ZitadelUserInfoResponse,
} from '../interfaces';
import { generateUserInfoCacheKey } from '../utils';

/**
 * @description
 * Validates access tokens issued by ZITADEL. Supports **two token formats**:
 *
 * 1. **JWT** — verified locally via the JWKS discovered from the OIDC well-known endpoint.
 * 2. **Opaque** — validated by presenting the token to the OIDC UserInfo endpoint.
 *
 * In both cases rich claims (email, roles, metadata, org) are fetched from the UserInfo endpoint and cached in Redis.
 *
 * To switch to another IdP, create a new class implementing `IAuthProvider` and swap `useClass` in `AuthModule`.
 */
@Injectable()
export class ZitadelAuthProvider
  implements IAuthProvider, OnModuleInit
{
  private jwks!: JWTVerifyGetKey;
  private jwksUri!: string;
  private userinfoEndpoint!: string;
  private issuer!: string;
  /** @description Extra headers required when the internal URL differs from the external one. */
  private internalHeaders: Record<string, string> | undefined;
  /** @description Cache TTL for userinfo responses (in seconds). */
  private static readonly USERINFO_CACHE_TTL_SECONDS = 60;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.discoverOidcConfig();
  }

  async validateToken(token: string): Promise<IAuthUser> {
    /**
     * Zitadel issues opaque access tokens by default.
     * If the OIDC app is configured with accessTokenType = JWT the token
     * will be a standard three-part JWT (header.payload.signature).
     * We detect the format and choose the appropriate validation strategy.
     */
    if (this.isJwt(token)) {
      return this.validateJwt(token);
    }

    return this.validateOpaque(token);
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

    const { payload } = await jwtVerify<ZitadelJwtPayload>(
      token,
      this.jwks,
      {
        issuer: this.issuer,
      },
    );

    /**
     * @description
     * The Zitadel access-token JWT only contains basic claims (sub, aud, iss…). Rich claims (email, roles, metadata, org) are available via the standard OIDC UserInfo endpoint.
     */
    const userInfo = await this.fetchUserInfo(token);

    return this.normalizeUserInfo(payload.sub, userInfo);
  }

  /**
   * @description
   * Validate an opaque (non-JWT) access token by calling the UserInfo endpoint.
   *
   * Zitadel issues opaque tokens by default. The only way to verify them is to present the token to the UserInfo endpoint — if it returns 200 the token is valid.
   */
  private async validateOpaque(token: string): Promise<IAuthUser> {
    // Lazy-init if discovery failed at startup
    if (!this.userinfoEndpoint) {
      await this.discoverOidcConfig();
    }

    if (!this.userinfoEndpoint) {
      throw new Error(
        'OIDC provider is not available. Could not discover UserInfo endpoint.',
      );
    }

    const userInfo = await this.fetchUserInfo(token);

    return this.normalizeUserInfo(userInfo.sub, userInfo);
  }

  /**
   * @description
   * Detect whether a token string is a JWT (three Base64url segments separated by dots) or an opaque reference token.
   */
  private isJwt(token: string): boolean {
    const parts = token.split('.');

    return parts.length === 3 && parts.every((p) => p.length > 0);
  }

  /**
   * @description
   * Discover the OIDC configuration (issuer, JWKS URI) from the well-known endpoint.
   *
   * When an internal URL is configured (e.g. `http://traefik:80`), we must send `Host: <externalDomain>` so that Zitadel recognises the request (it only responds to its configured EXTERNALDOMAIN).
   */
  private async discoverOidcConfig(): Promise<void> {
    const internalBase =
      this.options.issuerInternalUrl ?? this.options.issuerUrl;
    const discoveryUrl = urlBuilder(
      internalBase,
      '.well-known',
      'openid-configuration',
    );

    // Zitadel requires the Host header to match its EXTERNALDOMAIN.
    // When we call via the internal Docker network the default Host
    // would be e.g. "traefik" which Zitadel rejects.
    const externalHost = new URL(this.options.issuerUrl).host;
    const needsHostOverride = !!this.options.issuerInternalUrl;

    this.logger.log(
      `Discovering OIDC configuration from ${discoveryUrl}`,
    );

    try {
      const { data } =
        await axios.get<ZitadelOpenIdConfigurationResponse>(
          discoveryUrl,
          needsHostOverride
            ? { headers: { Host: externalHost } }
            : undefined,
        );
      /**
       * @description
       * When accessed via an internal URL the discovered issuer may omit the external port (e.g. "http://localhost" instead of "http://localhost:8080").  Always prefer the configured issuerUrl so that JWT verification matches the `iss` claim in tokens issued to end-users via the external URL.
       */
      this.issuer = this.options.issuerUrl;
      /** @description Rewrite the JWKS URI to use the internal base if needed */
      let jwksUri = data.jwks_uri;

      if (this.options.issuerInternalUrl) {
        const externalOrigin = new URL(this.options.issuerUrl).origin;
        const internalOrigin = new URL(internalBase).origin;

        jwksUri = jwksUri.replace(externalOrigin, internalOrigin);
      }

      /** @description Rewrite the userinfo endpoint to use the internal base if needed */
      let userinfoEndpoint = data.userinfo_endpoint;

      if (this.options.issuerInternalUrl) {
        const externalOrigin = new URL(this.options.issuerUrl).origin;
        const internalOrigin = new URL(internalBase).origin;

        userinfoEndpoint = userinfoEndpoint.replace(
          externalOrigin,
          internalOrigin,
        );
      }

      this.jwksUri = jwksUri;
      this.userinfoEndpoint = userinfoEndpoint;
      this.internalHeaders = needsHostOverride
        ? { Host: externalHost }
        : undefined;

      await this.refreshJwks();

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
   * Fetch the JSON Web Key Set from the JWKS URI using axios (which, unlike Node's built-in fetch, allows overriding the Host header) and build a local JWK set for token verification.
   */
  private async refreshJwks(): Promise<void> {
    const { data } = await axios.get<JSONWebKeySet>(this.jwksUri, {
      headers: this.internalHeaders,
    });

    this.jwks = createLocalJWKSet(data);
  }

  /**
   * @description
   * Retrieve the full set of claims (email, roles, metadata, org) from the OIDC UserInfo endpoint. Results are cached in Redis (keyed by a SHA-256 hash of the access token) for {@link USERINFO_CACHE_TTL_SECONDS} to avoid hitting the IdP on every GraphQL request.
   */
  private async fetchUserInfo(
    accessToken: string,
  ): Promise<ZitadelUserInfoResponse> {
    const cacheKey = generateUserInfoCacheKey(accessToken);

    try {
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as ZitadelUserInfoResponse;
      }
    } catch {
      // Redis read failure is non-fatal — fall through to the HTTP call.
    }

    const { data } = await axios.get<ZitadelUserInfoResponse>(
      this.userinfoEndpoint,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...this.internalHeaders,
        },
      },
    );

    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(data),
        ZitadelAuthProvider.USERINFO_CACHE_TTL_SECONDS,
      );
    } catch {
      // Redis write failure is non-fatal — the next request will retry.
    }

    return data;
  }

  /**
   * @description
   * Normalize ZITADEL UserInfo response into the provider-agnostic IAuthUser shape.
   */
  private normalizeUserInfo(
    sub: string,
    info: ZitadelUserInfoResponse,
  ): IAuthUser {
    const email = info.email ?? '';
    const emailVerified = info.email_verified ?? false;
    const orgId = info['urn:zitadel:iam:org:id'] ?? undefined;
    const rolesObj = info['urn:zitadel:iam:org:project:roles'] ?? {};
    const roles = Object.keys(rolesObj);
    const rawMetadata = info['urn:zitadel:iam:user:metadata'] ?? {};
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
