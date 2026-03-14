import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICY_KEY = 'checkPolicy';

export interface CheckPolicyMetadata {
  /**
   * @description Resource type
   * @example "novel" or "chapter"
   */
  resource: string;
  /**
   * @description Action being performed
   * @example "read", "create", "update", "delete"
   */
  action: string;
}

/**
 * @description
 * Decorator to mark a resolver/handler as requiring an ABAC policy check via the `IAuthorizationProvider`.
 * The `PoliciesGuard` reads this metadata and calls `IAuthorizationProvider.isAllowed()` with the resource context.
 *
 * @example `@CheckPolicy('novel', 'read')`
 */
export const CheckPolicy = (resource: string, action: string) =>
  SetMetadata(CHECK_POLICY_KEY, {
    resource,
    action,
  } satisfies CheckPolicyMetadata);
