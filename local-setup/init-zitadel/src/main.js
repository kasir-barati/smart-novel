// @ts-check

import {
  ConfigService,
  ZitadelAdminV1Service,
  ZitadelAuthV1Service,
  ZitadelManagementV1Service,
  ZitadelV2Service,
} from './services/index.js';
import {
  FileUtil,
  isEmpty,
  isNotEmpty,
  Logger,
  sleep,
  WaitUtil,
} from './utils/index.js';

async function main() {
  const configService = new ConfigService();

  try {
    Logger.section('Creating Test Users in ZITADEL');
    console.error(`ZITADEL URL: ${configService.zitadelUrl}`);
    console.error('');

    await WaitUtil.waitForZitadel(configService.zitadelUrl);
    await FileUtil.ensureDir(configService.clientDir);

    Logger.subsection('Loading PAT for authentication...');
    const accessToken = await FileUtil.readPatWithRetries(
      configService.patFile,
    );
    if (isEmpty(accessToken)) {
      Logger.error('Failed to load PAT. Exiting.');
      process.exit(1);
    }
    const v2Service = new ZitadelV2Service(
      configService.zitadelUrl,
      accessToken,
    );
    const managementV1Service = new ZitadelManagementV1Service(
      configService.zitadelUrl,
      accessToken,
    );
    const adminV1Service = new ZitadelAdminV1Service(
      configService.zitadelUrl,
      accessToken,
    );
    const authV1Service = new ZitadelAuthV1Service(
      configService.zitadelUrl,
      accessToken,
    );

    Logger.log('Enable impersonation in the security policy');
    await adminV1Service.enableImpersonationInSecurityPolicy();
    await v2Service.enableImpersonation();

    Logger.subsection('Verifying PAT...');
    await WaitUtil.verifyPatWithRetries(
      configService.zitadelUrl,
      accessToken,
    );

    Logger.section('Granting bot user impersonation permission');
    const botUser = await authV1Service.getCurrentUser();
    let botUserId = null;
    if (isNotEmpty(botUser.id)) {
      botUserId = botUser.id;
      Logger.log(
        `Bot user ID: ${botUser.id} — assigning IAM_END_USER_IMPERSONATOR...`,
      );
      const success = await adminV1Service.assignImpersonatorRole(
        botUser.id,
      );
      if (success) {
        Logger.ok('Impersonation role assigned to bot user');
      } else {
        Logger.warn('Impersonation role assignment may have failed');
      }
    } else {
      Logger.warn(
        'Could not determine bot user ID for impersonation role',
      );
    }

    Logger.section('Creating OIDC Project & Application');
    Logger.log('Creating project: smart-novel ...');
    const projectId =
      await managementV1Service.createProject('smart-novel');
    if (isEmpty(projectId)) {
      Logger.error('Failed to create or find project. Exiting.');
      process.exit(1);
    }
    Logger.ok(`Project created with ID: ${projectId}`);

    Logger.log('Creating OIDC application: smart-novel-app ...');
    const clientId = await managementV1Service.createOidcApp(
      projectId,
      'smart-novel-app',
    );
    if (isNotEmpty(clientId)) {
      Logger.ok(`Application created with client ID: ${clientId}`);
      Logger.ok(`Writing client ID to ${configService.clientIdFile}`);
      await FileUtil.writeFile(configService.clientIdFile, clientId);
    } else {
      Logger.warn(
        'Could not determine client ID - login flow will not work!',
      );
    }

    Logger.section('Creating E2E Confidential OIDC Application');
    Logger.log(
      'Creating confidential OIDC application: e2e-smart-novel-app ...',
    );
    const { clientId: e2eClientId, clientSecret: e2eClientSecret } =
      await managementV1Service.createConfidentialOidcApp(
        projectId,
        'e2e-smart-novel-app',
      );
    if (isNotEmpty(e2eClientId)) {
      Logger.ok(
        `Confidential application created with client ID: ${e2eClientId}`,
      );
      Logger.ok(
        `Writing e2e client ID to ${configService.e2eClientIdFile}`,
      );
      await FileUtil.writeFile(
        configService.e2eClientIdFile,
        e2eClientId,
      );
    } else {
      Logger.warn(
        'Could not determine e2e client ID - impersonation in e2e tests will not work!',
      );
    }
    if (isNotEmpty(e2eClientSecret)) {
      Logger.ok(
        `Writing e2e client secret to ${configService.e2eClientSecretFile} (${e2eClientSecret.length} chars)`,
      );
      await FileUtil.writeFile(
        configService.e2eClientSecretFile,
        e2eClientSecret,
      );
    } else {
      Logger.warn(
        'Could not determine e2e client secret - impersonation in e2e tests will not work!',
      );
    }

    Logger.section('Creating Project Roles');
    Logger.log('Creating project roles...');
    await managementV1Service.createProjectRole(projectId, {
      roleKey: 'admin',
      displayName: 'Admin',
      group: 'smart-novel',
    });
    Logger.ok("Role 'admin' created or already exists");

    await managementV1Service.createProjectRole(projectId, {
      roleKey: 'writer',
      displayName: 'Writer',
      group: 'smart-novel',
    });
    Logger.ok("Role 'writer' created or already exists");

    await managementV1Service.createProjectRole(projectId, {
      roleKey: 'user',
      displayName: 'User',
      group: 'smart-novel',
    });
    Logger.ok("Role 'user' created or already exists");

    Logger.log('Small delay for eventual consistency...');
    await sleep(2000);

    Logger.section('Creating Human Users (for interactive login)');
    Logger.log('Creating user: admin@test.com ...');
    const adminUserId = await v2Service.createHumanUser({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin123!',
    });
    if (isNotEmpty(adminUserId)) {
      Logger.ok(`User created with ID: ${adminUserId}`);
      Logger.log(
        "Assigning role 'admin' to user " + adminUserId + '...',
      );
      await managementV1Service.assignRoleToUser(
        adminUserId,
        projectId,
        'admin',
      );
      Logger.ok("Role 'admin' assigned to user");
      Logger.ok(
        `Writing admin user ID to ${configService.adminUserIdFile}`,
      );
      await FileUtil.writeFile(
        configService.adminUserIdFile,
        adminUserId,
      );
    }

    Logger.log('Creating user: writer@test.com ...');
    const writerUserId = await v2Service.createHumanUser({
      email: 'writer@test.com',
      firstName: 'Writer',
      lastName: 'User',
      password: 'Writer123!',
    });
    if (isNotEmpty(writerUserId)) {
      Logger.ok(`User created with ID: ${writerUserId}`);
      Logger.log(
        "Assigning role 'writer' to user " + writerUserId + '...',
      );
      await managementV1Service.assignRoleToUser(
        writerUserId,
        projectId,
        'writer',
      );
      Logger.ok("Role 'writer' assigned to user");
      Logger.ok(
        `Writing writer user ID to ${configService.writerUserIdFile}`,
      );
      await FileUtil.writeFile(
        configService.writerUserIdFile,
        writerUserId,
      );
    }

    Logger.log('Creating user: user@test.com ...');
    const regularUserId = await v2Service.createHumanUser({
      email: 'user@test.com',
      firstName: 'Regular',
      lastName: 'User',
      password: 'User123!',
    });
    if (isNotEmpty(regularUserId)) {
      Logger.ok(`User created with ID: ${regularUserId}`);
      Logger.log(
        "Assigning role 'user' to user " + regularUserId + '...',
      );
      await managementV1Service.assignRoleToUser(
        regularUserId,
        projectId,
        'user',
      );
      Logger.ok("Role 'user' assigned to user");
      Logger.ok(
        `Writing user user ID to ${configService.userUserIdFile}`,
      );
      await FileUtil.writeFile(
        configService.userUserIdFile,
        regularUserId,
      );
    }

    Logger.section('Summary');
    console.error('Test users have been created!');
    console.error('');
    console.error('Admin User:');
    console.error('  Email: admin@test.com');
    console.error('  Password: Admin123!');
    console.error(`  User ID file: ${configService.adminUserIdFile}`);
    console.error('');
    console.error('Writer User:');
    console.error('  Email: writer@test.com');
    console.error('  Password: Writer123!');
    console.error(
      `  User ID file: ${configService.writerUserIdFile}`,
    );
    console.error('');
    console.error('Regular User:');
    console.error('  Email: user@test.com');
    console.error('  Password: User123!');
    console.error(`  User ID file: ${configService.userUserIdFile}`);
    console.error('');
    console.error('Bot (machine user):');
    console.error(`  PAT: ${configService.patFile}`);
    console.error('');
    console.error('OIDC Application (frontend):');
    console.error('  Project: smart-novel');
    console.error('  App: smart-novel-app');
    console.error(`  Client ID: ${clientId || 'N/A'}`);
    console.error('');
    console.error('OIDC Application (e2e, confidential):');
    console.error('  App: e2e-smart-novel-app');
    console.error(`  Client ID: ${e2eClientId || 'N/A'}`);
    console.error(
      `  Client Secret: ${e2eClientSecret ? `${e2eClientSecret.length} chars` : 'N/A'}`,
    );
    console.error('');
    console.error(`Visit: ${configService.zitadelUrl}`);
    console.error('');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    Logger.error(`Fatal error: ${errorMessage}`);
    console.error(error);
    process.exit(1);
  }
}

main();
