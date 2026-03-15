import axios from 'axios';

export interface AuthUrlsResponse {
  signIn: string;
  signOut: string;
  session: string;
  callback: string;
}

export class AuthorizationFixture {
  /**
   * Fetches the Auth.js route URLs from the GraphQL API.
   *
   * NOTE: With the move away from ROPC, programmatic login with
   * email + password is no longer possible through the GraphQL API.
   * Authentication must go through the browser-based OIDC
   * Authorization Code + PKCE flow.
   *
   * For e2e tests that require an authenticated session, use a
   * ZITADEL Personal Access Token (PAT) or a service account JWT
   * directly in the Authorization header.
   */
  async getAuthUrls(): Promise<AuthUrlsResponse> {
    const { data } = await axios.post('/graphql', {
      query: `#graphql
        query {
          authUrls {
            signIn
            signOut
            session
            callback
          }
        }
      `,
    });

    return data.data.authUrls;
  }

  /**
   * Creates an Authorization header using a pre-provisioned PAT
   * (Personal Access Token) for e2e test authentication.
   *
   * The PAT should be set via the ZITADEL_E2E_PAT environment variable
   * or loaded from the shared volume at /zitadel-pat/token.
   */
  getAuthHeader(): string {
    const pat = process.env.ZITADEL_E2E_PAT;
    if (!pat) {
      throw new Error(
        'ZITADEL_E2E_PAT environment variable is required for authenticated e2e tests. ' +
          'ROPC (grant_type=password) is not supported by ZITADEL.',
      );
    }
    return `Bearer ${pat}`;
  }
}
