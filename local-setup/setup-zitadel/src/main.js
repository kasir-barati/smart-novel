// @ts-check

import { roles, users } from './data/index.js';
import {
  config,
  ZitadelAdminV1Service,
  ZitadelAuthV1Service,
  ZitadelManagementV1Service,
  ZitadelUsersV2Service,
} from './services/index.js';
import {
  FileUtil,
  isEmpty,
  isNotEmpty,
  Logger,
  sleep,
} from './utils/index.js';

const accessToken = await FileUtil.readPatWithRetries(config.patFile);
const usersV2Service = new ZitadelUsersV2Service(
  config.zitadelUrl,
  accessToken,
);
const managementV1Service = new ZitadelManagementV1Service(
  config.zitadelUrl,
  accessToken,
);
const adminV1Service = new ZitadelAdminV1Service(
  config.zitadelUrl,
  accessToken,
);
const authV1Service = new ZitadelAuthV1Service(
  config.zitadelUrl,
  accessToken,
);

Logger.section('Creating OIDC Project & Application');
Logger.log(
  `Creating ${config.projectName} project for ${config.appName} app...`,
);
const projectId =
  await managementV1Service.createProject('smart-novel');
Logger.log(`Creating OIDC application: ${config.appName} ...`);
const { clientId } = await managementV1Service.createOidcApp(
  projectId,
  config.appName,
);
Logger.ok(`Writing client ID to ${config.clientIdFile}`);
await FileUtil.writeFile(config.clientIdFile, clientId);

Logger.section(
  'Creating Confidential OIDC Application for Integration Tests',
);
Logger.log(
  `Creating confidential OIDC application: ${config.integrationTest.appName}...`,
);
const {
  clientId: integrationTestClientId,
  clientSecret: integrationTestClientSecret,
} = await managementV1Service.createOidcApp(
  projectId,
  config.integrationTest.appName,
  'confidential',
);
Logger.log(
  `Writing integration test client ID to ${config.integrationTest.clientIdFile}`,
);
await FileUtil.writeFile(
  config.integrationTest.clientIdFile,
  integrationTestClientId,
);
if (isNotEmpty(integrationTestClientSecret)) {
  Logger.log(
    `Writing integration test client secret to ${config.integrationTest.clientSecretFile}...`,
  );
  await FileUtil.writeFile(
    config.integrationTest.clientSecretFile,
    integrationTestClientSecret,
  );
}

Logger.section('Creating Project Roles');
for (const role of roles) {
  await managementV1Service.createProjectRole(projectId, {
    group: config.appName,
    ...role,
  });
  Logger.ok(`Role '${role.roleKey}' created or already exists`);
}
Logger.log('Small delay for eventual consistency...');
await sleep(2000);

Logger.section('Creating Human Users (for interactive login)');
for (const { userInfo, role, userIdFile } of users) {
  Logger.log(`Creating ${userInfo.email} user...`);
  const userId = await usersV2Service.createHumanUser(userInfo);
  Logger.log(`Assigning role '${role}' to ${userId}...`);
  await managementV1Service.assignRoleToUser(userId, projectId, role);
  Logger.log(`Writing ${role} user ID to ${userIdFile}...`);
  await FileUtil.writeFile(userIdFile, userId);
}

Logger.section('Enable Impersonation');
Logger.log('Enabling impersonation in the security policy...');
await adminV1Service.enableImpersonationInSecurityPolicy();
Logger.log('Granting bot user impersonation permission...');
const { userId: botUserId, organizationId } =
  await authV1Service.getCurrentUser();
Logger.log(
  `Assigning impersonation role to the bot user ${botUserId} (org: ${organizationId})...`,
);
await adminV1Service.assignImpersonatorRole(botUserId);
Logger.log(
  'Creating machine user: integration-test-impersonator-bot...',
);
const integrationTestBotUserId =
  await usersV2Service.createMachineUser({
    organizationId,
    username: 'integration-test-impersonator-bot',
    name: 'Integration Test Impersonation Bot',
    description: 'Machine user for integration test token exchange',
  });
Logger.log('Creating JSON key for the integration-test bot...');
const botKey = await usersV2Service.addKey(
  integrationTestBotUserId,
  '9999-12-31T23:59:59Z',
);
await FileUtil.writeFile(
  config.integrationTest.botKeyPath,
  JSON.stringify(botKey, null, 2),
);
Logger.log(
  'Assigning IAM_END_USER_IMPERSONATOR role to Integration Test bot...',
);
await adminV1Service.assignImpersonatorRole(integrationTestBotUserId);
Logger.log(
  `Granting Integration Test bot ${integrationTestBotUserId} access to project ${projectId}...`,
);
await managementV1Service.grantUserProjectAccess(
  integrationTestBotUserId,
  projectId,
  [], // 👈 IMPORTANT: do NOT assign any role to the impersonator!
);
Logger.log('Generating PAT for integration test machine user...');
const integrationTestBotPat = await managementV1Service.createUserPat(
  integrationTestBotUserId,
);
Logger.ok(
  `Writing integration test bot PAT to ${config.integrationTest.botPatFile}`,
);
await FileUtil.writeFile(
  config.integrationTest.botPatFile,
  integrationTestBotPat,
);
Logger.log('Waiting 3 seconds for project grant to propagate...');
await sleep(3000);
Logger.log('Verifying integration test bot project grant...');
const grants = await managementV1Service.listUserGrants(
  integrationTestBotUserId,
);
Logger.log(
  `integration test bot has ${grants.length} project grant(s)`,
);
const projectGrant = grants.find(
  (grant) => grant.projectId === projectId,
);
if (isEmpty(projectGrant)) {
  Logger.error(
    `Integration test bot does NOT have a grant for project ${projectId}. Grants found: ${JSON.stringify(grants, null, 2)}`,
  );
  throw new Error(
    'Integration test bot project grant verification failed!',
  );
}
Logger.ok(
  `✓ Confirmed: integration test bot has grant for project ${projectId} with roles: ${projectGrant.roleKeys?.join(', ') || 'none'}`,
);
