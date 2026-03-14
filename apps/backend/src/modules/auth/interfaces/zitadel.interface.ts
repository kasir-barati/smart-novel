import type { JWTPayload } from 'jose';

export interface ZitadelOpenIdConfigurationResponse {
  issuer: string;
  jwks_uri: string;
}

export interface ZitadelJwtPayload extends JWTPayload {
  email?: string;
  email_verified?: boolean;
  /**
   * @description ZITADEL organization ID
   */
  'urn:zitadel:iam:org:id'?: string;
  /**
   * @description ZITADEL roles
   * @example
   * ```json
   * { "role_name": { "orgId": "orgDomain" } }
   * ```
   */
  'urn:zitadel:iam:org:project:roles'?: Record<string, unknown>;
  /**
   * @description ZITADEL metadata
   * @example
   * ```json
   * { "key": "base64value" }
   * ```
   */
  'urn:zitadel:iam:user:metadata'?: Record<string, string>;
}
