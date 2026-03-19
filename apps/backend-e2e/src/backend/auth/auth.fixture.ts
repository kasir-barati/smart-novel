/**
 * @description
 * Supported test user roles.
 *
 * - `bot`    — IAM_OWNER machine user (the service account PAT created by Zitadel at startup)
 * - `admin`  — Human user with the "admin" project role
 * - `writer` — Human user with the "writer" project role
 */
export type TestRole = 'bot' | 'admin' | 'writer';

const ENV_VAR_MAP: Record<TestRole, string> = {
  bot: 'ZITADEL_E2E_PAT',
  admin: 'ZITADEL_E2E_ADMIN_PAT',
  writer: 'ZITADEL_E2E_WRITER_PAT',
};

export class AuthorizationFixture {
  /**
   * @description
   * Creates an Authorization header using a pre-provisioned PAT (Personal Access Token) for e2e test authentication.
   *
   * PATs are extracted from the Zitadel Docker volume during `global-setup.ts` and loaded into `process.env` by `vitest.setup.ts`.
   */
  getAuthHeader(role: TestRole = 'admin'): string {
    const envVar = ENV_VAR_MAP[role];
    const pat = process.env[envVar];

    if (!pat) {
      throw new Error(
        `${envVar} environment variable is required for authenticated e2e tests. ` +
          `Ensure the PAT was created by create-test-users.sh and extracted by global-setup.ts.`,
      );
    }

    return `Bearer ${pat}`;
  }
}
