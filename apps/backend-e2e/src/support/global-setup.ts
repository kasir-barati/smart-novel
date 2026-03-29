import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { DockerFixture } from './docker.fixture';
import { Logger } from './logger';

declare global {
  var __TEARDOWN_MESSAGE__: string;
}
const workspaceRoot = resolve(__dirname, '../../../../');

export default async function setup() {
  Logger.section('Setting up Vitest globally');

  execSync(
    'docker compose --profile backend-e2e up -d --build --wait backend-e2e',
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
    },
  );

  await import('./config.helper.js');

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';

  // Clean up logic here (e.g. stopping services, docker-compose, etc.).
  return async () => {
    mkdirSync(resolve(workspaceRoot, 'local-setup/logs'), {
      recursive: true,
    });
    DockerFixture.persistLogs(
      workspaceRoot,
      'init-postgres',
      'local-setup/logs/init-postgres.log',
      'backend-e2e',
    );
    DockerFixture.persistLogs(
      workspaceRoot,
      'zitadel',
      'local-setup/logs/zitadel.log',
      'backend-e2e',
    );
    DockerFixture.persistLogs(
      workspaceRoot,
      'backend-e2e',
      'local-setup/logs/backend.log',
      'backend-e2e',
    );
    DockerFixture.stopCompose(workspaceRoot, 'backend-e2e');
    Logger.log(globalThis.__TEARDOWN_MESSAGE__);
  };
}
