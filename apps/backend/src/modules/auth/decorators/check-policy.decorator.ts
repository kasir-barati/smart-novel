import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICY_KEY = 'checkPolicy';

export interface CheckPolicyMetadata {
  /** Resource type (e.g., "novel", "chapter") */
  resource: string;
  /** Action being performed (e.g., "read", "create", "update", "delete") */
  action: string;
}

/**
 * @description Decorator to mark a resolver/handler as requiring
 * an ABAC policy check via the IAuthorizationProvider.
 *
 * Usage: @CheckPolicy('novel', 'read')
 *
 * The PoliciesGuard reads this metadata and calls
 * IAuthorizationProvider.isAllowed() with the resource context.
 */
export const CheckPolicy = (resource: string, action: string) =>
  SetMetadata(CHECK_POLICY_KEY, {
    resource,
    action,
  } satisfies CheckPolicyMetadata);
