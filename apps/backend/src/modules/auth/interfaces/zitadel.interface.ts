import type { JWTPayload } from 'jose';

export interface ZitadelOpenIdConfigurationResponse {
  issuer: string;
  jwks_uri: string;
}

export interface ZitadelJwtPayload extends JWTPayload {
  /** @example "http://localhost:8080" */
  iss: string;
  /** @example "364554362883670018" */
  sub: string;
  /**
   * @example
   * ```json
   * [
   *   "364554362732740610",
   *   "364554362682343426",
   *   "364554334932959234"
   * ]
   * ```
   */
  aud: string[];
  /** @example 1773839673 */
  exp: number;
  /** @example 1773796473 */
  iat: number;
  /** @example 1773796473 */
  auth_time: number;
  /** @example ["pwd"] */
  amr: string[];
  /** @example "364554362732740610" */
  azp: string;
  /** @example "364554362732740610" */
  client_id: string;
  /** @example "CLhcEcSNnBOBergGHtMHSA" */
  at_hash: string;
  /** @example "364569658990264322" */
  sid: string;
}
