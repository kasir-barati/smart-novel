import { isEmpty } from 'class-validator';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

declare global {
  var __TEARDOWN_MESSAGE__: string;
}

/**
 * @description
 * Extract a PAT from the shared `zitadel-pat` Docker volume via the `backend-e2e` container (which mounts it read-only).
 */
function extractPat(
  workspaceRoot: string,
  containerPath: string,
  localFile: string,
): void {
  try {
    const pat = execSync(
      `docker compose --profile backend-e2e exec -T backend-e2e cat ${containerPath}`,
      {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    ).trim();

    if (isEmpty(pat)) {
      console.warn(`  ⚠ ${containerPath} was empty`);
      return;
    }

    const outPath = path.resolve(workspaceRoot, localFile);

    writeFileSync(outPath, pat, 'utf-8');
    console.log(
      `  ✓ Extracted ${containerPath} → ${localFile} (${pat.length} chars)`,
    );
  } catch (error) {
    console.warn(`  ⚠ Could not extract ${containerPath}: ${error}`);
  }
}

export default async function setup() {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  const workspaceRoot = path.resolve(__dirname, '../../../../');
  execSync(
    'docker compose --profile backend-e2e up -d --build --wait backend-e2e',
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
    },
  );

  // Extract per-user PATs from the Docker volume so e2e tests can
  // authenticate as different roles (admin, writer, bot/machine user).
  console.log('\nExtracting PATs from Docker volume...\n');

  mkdirSync(path.resolve(workspaceRoot, 'local-setup/pats'), {
    recursive: true,
  });
  extractPat(
    workspaceRoot,
    '/zitadel-pat/token',
    'local-setup/pats/bot',
  );
  extractPat(
    workspaceRoot,
    '/zitadel-pat/admin-pat',
    'local-setup/pats/admin',
  );
  extractPat(
    workspaceRoot,
    '/zitadel-pat/writer-pat',
    'local-setup/pats/writer',
  );

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';

  // Return teardown function for Vitest
  return async () => {
    // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
    // Hint: `globalThis` is shared between setup and teardown.
    const workspaceRoot = path.resolve(__dirname, '../../../../');
    execSync(
      'docker compose --profile backend-e2e logs backend-e2e',
      {
        cwd: workspaceRoot,
        stdio: 'inherit',
      },
    );
    execSync('docker compose --profile backend-e2e down', {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  };
}
