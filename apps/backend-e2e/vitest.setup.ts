import axios from 'axios';
import * as matchers from 'jest-extended';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

// Extend vitest matchers with jest-extended
expect.extend(matchers);

// Configure axios for tests to use.
const host = process.env.HOST ?? 'localhost';
const port = process.env.TRAEFIK_EXPOSED_PORT ?? '8080';

axios.defaults.baseURL = `http://${host}:${port}`;

// ── Load per-user PATs from files written by global-setup ───────────
// The global-setup extracts them from the Docker volume into local-setup/pats/
// files. Each file contains a single opaque PAT string.
const workspaceRoot = path.resolve(__dirname, '../../');

function loadPat(file: string, envVar: string): void {
  // Don't overwrite if already set (e.g. via CI env vars)
  if (process.env[envVar]) return;

  try {
    const pat = readFileSync(
      path.join(workspaceRoot, file),
      'utf-8',
    ).trim();
    if (pat) {
      process.env[envVar] = pat;
    }
  } catch {
    // File may not exist if PAT creation failed — tests that need it will throw a clear error via AuthorizationFixture.
  }
}

loadPat('local-setup/pats/bot', 'ZITADEL_E2E_PAT');
loadPat('local-setup/pats/admin', 'ZITADEL_E2E_ADMIN_PAT');
loadPat('local-setup/pats/writer', 'ZITADEL_E2E_WRITER_PAT');
