// @ts-check

/**
 * Service for interacting with ZITADEL Admin V1 API endpoints
 */
export class ZitadelAdminV1Service {
  /**
   * @param {string} baseUrl - ZITADEL base URL
   * @param {string} accessToken - Bearer token for authentication
   */
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  /**
   * Update security policy to enable impersonation
   * @returns {Promise<void>}
   */
  async enableImpersonationInSecurityPolicy() {
    await fetch(`${this.baseUrl}/admin/v1/policies/security`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enableImpersonation: true,
      }),
    });
  }

  /**
   * Assign IAM_END_USER_IMPERSONATOR role to a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async assignImpersonatorRole(userId) {
    if (!userId) {
      return false;
    }

    const response = await fetch(`${this.baseUrl}/admin/v1/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        roles: ['IAM_END_USER_IMPERSONATOR'],
      }),
    });

    const data = await response.json();
    const responseText = JSON.stringify(data).toLowerCase();

    return (
      responseText.includes('already') ||
      responseText.includes('creationdate') ||
      responseText.includes('details')
    );
  }
}
