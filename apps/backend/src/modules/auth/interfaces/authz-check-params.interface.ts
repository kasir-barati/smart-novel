import { IAuthUser } from './auth-user.interface';

/**
 * @description Parameters for an authorization check.
 * Maps naturally to Cerbos, OPA, Cedar, or any ABAC engine.
 */
export interface AuthzCheckParams {
  /** The authenticated user (principal) */
  principal: IAuthUser;
  /** The resource type being accessed (e.g., "novel", "chapter") */
  resource: string;
  /** The resource's unique identifier */
  resourceId: string;
  /** The action being performed (e.g., "read", "create", "update", "delete") */
  action: string;
  /** Arbitrary resource attributes for ABAC decisions */
  resourceAttributes?: Record<string, string>;
}
