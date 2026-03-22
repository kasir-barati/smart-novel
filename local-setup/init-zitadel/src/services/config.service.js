// @ts-check

export class ConfigService {
  zitadelUrl = process.env.ZITADEL_URL ?? 'http://localhost:8080';
  patFile = '/zitadel-pat/token';
  clientDir = '/zitadel-pat/client';
  clientIdFile = `${this.clientDir}/smart-novel-app-id`;
  e2eClientIdFile = `${this.clientDir}/e2e-smart-novel-app-id`;
  e2eClientSecretFile = `${this.clientDir}/e2e-smart-novel-app-secret`;
  userUserIdFile = '/zitadel-pat/user-user-id';
  adminUserIdFile = '/zitadel-pat/admin-user-id';
  writerUserIdFile = '/zitadel-pat/writer-user-id';
}
