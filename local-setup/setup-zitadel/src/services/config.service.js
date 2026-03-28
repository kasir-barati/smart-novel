// @ts-check

import { mkdirSync } from 'fs';
import { join } from 'path';

import { isEmpty } from '../utils/index.js';

export const zitadelDir = '/zitadel-pat';
const clientDir = join(zitadelDir, 'client');
const integrationTestDir = join(zitadelDir, 'integration-test');
const appName = process.env.ZITADEL_APP_NAME;
const zitadelUrl = process.env.ZITADEL_URL;

if (isEmpty(appName)) {
  throw new Error('ZITADEL_APP_NAME environment variable is not set');
}
if (isEmpty(zitadelUrl)) {
  throw new Error('ZITADEL_URL environment variable is not set');
}

export class ConfigService {
  constructor() {
    mkdirSync(clientDir, { recursive: true });
    mkdirSync(integrationTestDir, { recursive: true });
  }

  appName = appName;
  zitadelUrl = zitadelUrl;
  projectName = `${this.appName}-project`;

  patFile = join(zitadelDir, 'token');
  projectIdFile = join(zitadelDir, 'project-id');

  clientIdFile = join(clientDir, `${this.appName}-client-id`);

  integrationTest = {
    appName: `${this.appName}-integration-test`,
    botPatFile: join(integrationTestDir, 'bot-token'),
    botKeyPath: join(integrationTestDir, 'bot-key.json'),
    clientIdFile: join(
      integrationTestDir,
      `${this.appName}-client-id`,
    ),
    clientSecretFile: join(
      integrationTestDir,
      `${this.appName}-secret`,
    ),
  };
}
