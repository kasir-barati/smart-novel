// @ts-check

/**
 * Service for interacting with ZITADEL Management V1 API endpoints
 */
export class ZitadelManagementV1Service {
  /**
   * @param {string} baseUrl - ZITADEL base URL
   * @param {string} accessToken - Bearer token for authentication
   */
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  /**
   * Create a project in ZITADEL
   * @param {string} projectName - Project name
   * @returns {Promise<string|null>} Project ID or null on failure
   */
  async createProject(projectName) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          projectRoleAssertion: true,
        }),
      },
    );

    const data = await response.json();

    if (data.id) {
      return data.id;
    }

    // Check if project already exists
    if (JSON.stringify(data).toLowerCase().includes('already')) {
      return await this.findProjectByName(projectName);
    }

    return null;
  }

  /**
   * Find a project by name
   * @param {string} projectName - Project name
   * @returns {Promise<string|null>} Project ID or null if not found
   */
  async findProjectByName(projectName) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects/_search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              nameQuery: {
                name: projectName,
                method: 'TEXT_QUERY_METHOD_EQUALS',
              },
            },
          ],
        }),
      },
    );

    const data = await response.json();
    return data.result?.[0]?.id || null;
  }

  /**
   * Create a role in a project
   * @param {string} projectId - Project ID
   * @param {Object} role - Role configuration
   * @param {string} role.roleKey - Role key (e.g., 'admin', 'writer', 'user')
   * @param {string} role.displayName - Role display name
   * @param {string} role.group - Role group
   * @returns {Promise<boolean>} Success status
   */
  async createProjectRole(
    projectId,
    { roleKey, displayName, group },
  ) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects/${projectId}/roles`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleKey,
          displayName,
          group,
        }),
      },
    );

    const data = await response.json();
    const responseText = JSON.stringify(data).toLowerCase();

    return (
      responseText.includes('already') ||
      responseText.includes('details')
    );
  }

  /**
   * Assign a role to a user
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {string} roleKey - Role key to assign
   * @returns {Promise<boolean>} Success status
   */
  async assignRoleToUser(userId, projectId, roleKey) {
    if (!userId) {
      return false;
    }

    const response = await fetch(
      `${this.baseUrl}/management/v1/users/${userId}/grants`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          roleKeys: [roleKey],
        }),
      },
    );

    const data = await response.json();
    const responseText = JSON.stringify(data).toLowerCase();

    return (
      responseText.includes('already') ||
      responseText.includes('grantid')
    );
  }

  /**
   * Create a Personal Access Token for a user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} PAT token or null on failure
   */
  async createUserPat(userId) {
    if (!userId) {
      return null;
    }

    const response = await fetch(
      `${this.baseUrl}/management/v1/users/${userId}/pats`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expirationDate: '9999-12-31T23:59:59Z',
        }),
      },
    );

    const data = await response.json();
    return data.token || null;
  }

  /**
   * Create an OIDC application (public client)
   * @param {string} projectId - Project ID
   * @param {string} appName - Application name
   * @returns {Promise<string|null>} Client ID or null on failure
   */
  async createOidcApp(projectId, appName) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects/${projectId}/apps/oidc`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: appName,
          redirectUris: ['http://localhost:8080/auth/callback'],
          postLogoutRedirectUris: ['http://localhost:8080'],
          responseTypes: ['OIDC_RESPONSE_TYPE_CODE'],
          grantTypes: [
            'OIDC_GRANT_TYPE_AUTHORIZATION_CODE',
            'OIDC_GRANT_TYPE_TOKEN_EXCHANGE',
          ],
          appType: 'OIDC_APP_TYPE_NATIVE',
          authMethodType: 'OIDC_AUTH_METHOD_TYPE_NONE',
          devMode: true,
        }),
      },
    );

    const data = await response.json();

    if (data.clientId) {
      return data.clientId;
    }

    // Check if app already exists
    if (JSON.stringify(data).toLowerCase().includes('already')) {
      return await this.findAppClientId(projectId);
    }

    return null;
  }

  /**
   * Create a confidential OIDC application (with client secret)
   * @param {string} projectId - Project ID
   * @param {string} appName - Application name
   * @returns {Promise<{clientId: string|null, clientSecret: string|null}>} Client ID and secret
   */
  async createConfidentialOidcApp(projectId, appName) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects/${projectId}/apps/oidc`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: appName,
          redirectUris: ['http://localhost:8080/e2e/callback'],
          postLogoutRedirectUris: [],
          responseTypes: [
            'OIDC_RESPONSE_TYPE_TOKEN',
            'OIDC_RESPONSE_TYPE_CODE',
          ],
          grantTypes: [
            'OIDC_GRANT_TYPE_IMPLICIT',
            'OIDC_GRANT_TYPE_TOKEN_EXCHANGE',
            'OIDC_GRANT_TYPE_CLIENT_CREDENTIALS',
          ],
          appType: 'OIDC_APP_TYPE_NATIVE',
          authMethodType: 'OIDC_AUTH_METHOD_TYPE_BASIC',
          devMode: true,
        }),
      },
    );

    const data = await response.json();

    return {
      clientId: data.clientId || null,
      clientSecret: data.clientSecret || null,
    };
  }

  /**
   * Find first app client ID in a project
   * @param {string} projectId - Project ID
   * @returns {Promise<string|null>} Client ID or null if not found
   */
  async findAppClientId(projectId) {
    const response = await fetch(
      `${this.baseUrl}/management/v1/projects/${projectId}/apps/_search`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();
    return data.result?.[0]?.oidcConfig?.clientId || null;
  }
}
