// @ts-check

import { mkdirSync } from 'fs';
import { join } from 'path';

import { isEmpty, Logger } from '../utils/index.js';

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

Logger.section('Configuration');
Logger.log('Ensuring necessary directories exist...');
mkdirSync(clientDir, { recursive: true });
mkdirSync(integrationTestDir, { recursive: true });

export const config = {
  appName: appName,
  zitadelUrl: zitadelUrl,
  projectName: `${appName}-project`,

  patFile: join(zitadelDir, 'token'),
  projectIdFile: join(zitadelDir, 'project-id'),

  clientIdFile: join(clientDir, `${appName}-client-id`),

  integrationTest: {
    appName: `${appName}-integration-test`,
    botPatFile: join(integrationTestDir, 'bot-token'),
    botKeyPath: join(integrationTestDir, 'bot-key.json'),
    clientIdFile: join(integrationTestDir, `${appName}-client-id`),
    clientSecretFile: join(integrationTestDir, `${appName}-secret`),
  },
};
