export class AuthorizationFixture {
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
