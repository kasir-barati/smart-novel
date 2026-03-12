/**
 * @description Provider-agnostic authenticated user representation.
 * Normalized from whatever IdP token claims are available
 * (ZITADEL, Keycloak, Auth0, Azure AD, etc.).
 */
export interface IAuthUser {
  /** Subject identifier (unique user ID from the IdP) */
  sub: string;
  /** User's email address */
  email: string;
  /** Whether the email has been verified by the IdP */
  emailVerified: boolean;
  /** Organization / tenant ID the user belongs to */
  orgId?: string;
  /** Roles assigned to the user (project-scoped or global) */
  roles: string[];
  /** Arbitrary key-value metadata from the IdP */
  metadata: Record<string, string>;
}
