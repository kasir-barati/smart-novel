/**
 * ZITADEL OAuth 2.0 / OpenID Connect Scopes
 *
 * @see https://zitadel.com/docs/apis/openidoauth/scopes
 */
export const ZITADEL_SCOPES = [
  // ========================================================================
  // Standard OpenID Connect Scopes
  // ========================================================================

  /** openid - REQUIRED SCOPE for OIDC authentication */
  'openid',

  /** profile - User Profile Information */
  'profile',

  /** email - Email Address and Verification */
  'email',

  /** offline_access - Refresh Token for Long-Lived Sessions */
  'offline_access',

  // ========================================================================
  // ZITADEL-Specific Extended Scopes
  // ========================================================================

  /** urn:zitadel:iam:user:metadata - Custom User Attributes */
  'urn:zitadel:iam:user:metadata',

  /** urn:zitadel:iam:user:resourceowner - Organization Information */
  'urn:zitadel:iam:user:resourceowner',

  /** urn:zitadel:iam:org:projects:roles - Project Role Assignments (CRITICAL FOR RBAC) */
  'urn:zitadel:iam:org:projects:roles',
].join(' ');
