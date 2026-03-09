import { execSync } from 'node:child_process';
import path from 'node:path';

declare global {
  var __TEARDOWN_MESSAGE__: string;
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
