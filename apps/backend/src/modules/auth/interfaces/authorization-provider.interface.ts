import { AuthzCheckParams } from './authz-check-params.interface';

/**
 * @description Provider-agnostic interface for authorization decisions.
 * Implement this for Cerbos, OPA, Cedar, or a custom engine.
 *
 * Today → CerbosAuthorizationProvider
 * Tomorrow → swap `useClass` in AuthModule to OpaAuthorizationProvider, etc.
 */
export interface IAuthorizationProvider {
  /**
   * Check whether the given principal is allowed to perform the
   * specified action on the specified resource.
   */
  isAllowed(params: AuthzCheckParams): Promise<boolean>;
}

export const AUTHORIZATION_PROVIDER = Symbol(
  'AUTHORIZATION_PROVIDER',
);
