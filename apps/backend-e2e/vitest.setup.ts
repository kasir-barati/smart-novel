import axios from 'axios';
import { config } from 'dotenv';
import * as matchers from 'jest-extended';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

const workspaceRoot = path.resolve(__dirname, '../../');

config({ path: path.join(workspaceRoot, '.env') });
expect.extend(matchers);

const host = process.env.HOST ?? 'localhost';
const port = process.env.TRAEFIK_EXPOSED_PORT ?? '8080';
axios.defaults.baseURL = `http://${host}:${port}`;

loadFileIntoEnv('local-setup/pats/e2e-bot', 'E2E_OIDC_BOT_PAT');

// E2E confidential OIDC app (client_credentials + token_exchange grants)
loadFileIntoEnv('local-setup/client/e2e-id', 'E2E_OIDC_CLIENT_ID');
loadFileIntoEnv(
  'local-setup/client/e2e-secret',
  'E2E_OIDC_CLIENT_SECRET',
);

// Human user IDs for impersonation via token exchange
loadFileIntoEnv('local-setup/user-ids/user', 'E2E_USER_USER_ID');
loadFileIntoEnv('local-setup/user-ids/admin', 'E2E_ADMIN_USER_ID');
loadFileIntoEnv('local-setup/user-ids/writer', 'E2E_WRITER_USER_ID');

function loadFileIntoEnv(file: string, envVar: string): void {
  // Don't overwrite if already set (e.g. via CI env vars)
  if (process.env[envVar]) return;

  try {
    const value = readFileSync(
      path.join(workspaceRoot, file),
      'utf-8',
    ).trim();

    if (value) {
      process.env[envVar] = value;
    }
  } catch {
    // File may not exist — tests that need it will throw a clear error via AuthorizationFixture.
  }
}
