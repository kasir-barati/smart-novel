import { IAuthUser } from './auth-user.interface';

/**
 * @description Provider-agnostic interface for authentication (token validation).
 * Implement this for ZITADEL, Keycloak, Auth0, Azure AD, etc.
 *
 * Today → ZitadelAuthProvider
 * Tomorrow → swap `useClass` in AuthModule to KeycloakAuthProvider, etc.
 */
export interface IAuthProvider {
  /**
   * Validate an access token (typically a JWT) and return the
   * normalized user attributes.
   */
  validateToken(token: string): Promise<IAuthUser>;
}

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
