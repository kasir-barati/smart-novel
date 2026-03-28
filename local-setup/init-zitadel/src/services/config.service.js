// @ts-check

import { mkdirSync } from 'fs';
import { join } from 'path';

const zitadelDir = '/zitadel-pat';
const clientDir = join(zitadelDir, 'client');
const userIdsDir = join(zitadelDir, 'user-ids');
const integrationTestDir = join(zitadelDir, 'integration-test');

export class ConfigService {
  constructor() {
    mkdirSync(clientDir, { recursive: true });
    mkdirSync(userIdsDir, { recursive: true });
    mkdirSync(integrationTestDir, { recursive: true });
  }

  appName = process.env.APP_NAME ?? 'smart-novel-app';
  projectName = `${this.appName}-project`;
  zitadelUrl = process.env.ZITADEL_URL ?? 'http://localhost:8080';

  patFile = join(zitadelDir, 'token');
  projectIdFile = join(zitadelDir, 'project-id');

  clientIdFile = join(clientDir, `${this.appName}-id`);

  userIds = {
    user: join(userIdsDir, 'user'),
    admin: join(userIdsDir, 'admin'),
    writer: join(userIdsDir, 'writer'),
  };

  integrationTest = {
    appName: `${this.appName}-integration-test`,
    botPatFile: join(integrationTestDir, 'bot-token'),
    botKeyPath: join(integrationTestDir, 'bot-key.json'),
    clientIdFile: join(integrationTestDir, `${this.appName}-id`),
    clientSecretFile: join(
      integrationTestDir,
      `${this.appName}-secret`,
    ),
  };
}
