// @ts-check

/**
 * Service for interacting with ZITADEL Auth V1 API endpoints
 */
export class ZitadelAuthV1Service {
  /**
   * @param {string} baseUrl - ZITADEL base URL
   * @param {string} accessToken - Bearer token for authentication
   */
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  /**
   * Get current authenticated user information
   * @returns {Promise<{id: string|null, username: string|null}>} User info
   */
  async getCurrentUser() {
    const response = await fetch(`${this.baseUrl}/auth/v1/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { id: null, username: null };
    }

    const data = await response.json();
    return {
      id: data.id || null,
      username: data.userName || null,
    };
  }

  /**
   * Verify that the access token is valid
   * @returns {Promise<boolean>} True if token is valid
   */
  async verifyToken() {
    const response = await fetch(`${this.baseUrl}/auth/v1/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return response.ok;
  }
}
