// config.js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function loadConfig() {
  const sharedDir = '/zitadel-pat';
  const clientDir = `${sharedDir}/client`;

  const [
    clientId,
    clientSecret,
    projectId,
    guestUserId,
    adminUserId,
    integrationTestBotKeyRaw,
  ] = await Promise.all([
    readFile(
      join(clientDir, 'integration-test-book-app-id'),
      'utf-8',
    ),
    readFile(
      join(clientDir, 'integration-test-book-app-secret'),
      'utf-8',
    ),
    readFile(join(sharedDir, 'project-id'), 'utf-8'),
    readFile(join(sharedDir, 'guest-user-id'), 'utf-8'),
    readFile(join(sharedDir, 'admin-user-id'), 'utf-8'),
    readFile(
      join(sharedDir, 'integration-test-bot.key.json'),
      'utf-8',
    ),
  ]);

  const integrationTestBotKey = JSON.parse(integrationTestBotKeyRaw);
  const zitadelIssuer = 'http://localhost:8080';
  const tokenEndpoint = 'http://traefik:80/oauth/v2/token';
  const apiUrl = 'http://traefik:80/api';

  const scopes = `openid profile email urn:zitadel:iam:org:project:id:${projectId}:aud urn:zitadel:iam:org:project:id:${projectId}:roles urn:zitadel:iam:user:metadata`;

  return {
    apiUrl,
    scopes,
    clientId,
    adminUserId,
    guestUserId,
    clientSecret,
    tokenEndpoint,
    zitadelIssuer,
    integrationTestBotKey,
  };
}

export const config = await loadConfig();
