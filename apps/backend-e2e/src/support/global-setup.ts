import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { DockerFixture } from './docker.fixture';

declare global {
  var __TEARDOWN_MESSAGE__: string;
}

const workspaceRoot = path.resolve(__dirname, '../../../../');

export default async function setup() {
  console.log('\nSetting up...\n');

  execSync(
    'docker compose --profile backend-e2e up -d --build --wait backend-e2e',
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
    },
  );

  console.log('\nExtracting PAT from Docker volume...\n');
  mkdirSync(path.resolve(workspaceRoot, 'local-setup/pats'), {
    recursive: true,
  });
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/e2e-bot-token',
    'local-setup/pats/e2e-bot',
    'backend-e2e',
  );

  console.log(
    '\nExtracting e2e client credentials from Docker volume...\n',
  );
  mkdirSync(path.resolve(workspaceRoot, 'local-setup/client'), {
    recursive: true,
  });
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/client/e2e-smart-novel-app-id',
    'local-setup/client/e2e-id',
    'backend-e2e',
  );
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/client/e2e-smart-novel-app-secret',
    'local-setup/client/e2e-secret',
    'backend-e2e',
  );

  console.log('\nExtracting user IDs from Docker volume...\n');
  mkdirSync(path.resolve(workspaceRoot, 'local-setup/user-ids'), {
    recursive: true,
  });
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/admin-user-id',
    'local-setup/user-ids/admin',
    'backend-e2e',
  );
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/writer-user-id',
    'local-setup/user-ids/writer',
    'backend-e2e',
  );
  DockerFixture.extractFile(
    workspaceRoot,
    '/zitadel-pat/user-user-id',
    'local-setup/user-ids/user',
    'backend-e2e',
  );

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';

  // Clean up logic here (e.g. stopping services, docker-compose, etc.).
  return async () => {
    mkdirSync(path.resolve(workspaceRoot, 'local-setup/logs'), {
      recursive: true,
    });
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
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  };
}
