import { isEmpty } from 'class-validator';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { Logger } from './logger';

/** @description the service name comes from the compose file */
type ServiceName = 'backend-e2e' | 'zitadel' | 'init-postgres';
/** @description the profile name comes from the compose file */
type ProfileName = 'backend-e2e' | 'frontend-e2e' | 'dev';

export class DockerFixture {
  /**
   * @description
   * Extract a file from the shared `zitadel-pat` Docker volume via the `backend-e2e` container (which mounts it read-only).
   */
  static extractFile(
    cwd: string,
    containerPath: string,
    hostFilePath: string,
    profileName: ProfileName,
  ): void {
    try {
      const fileContent = execSync(
        `docker compose --profile ${profileName} exec -T ${profileName} cat ${containerPath}`,
        {
          cwd,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      ).trim();

      if (isEmpty(fileContent)) {
        Logger.warn(`${containerPath} was empty`);
        return;
      }

      const outPath = path.resolve(cwd, hostFilePath);

      writeFileSync(outPath, fileContent, 'utf-8');
      Logger.log(
        `Extracted ${containerPath} → ${hostFilePath} (${fileContent.length} chars)`,
      );
    } catch (error) {
      Logger.warn(`Could not extract ${containerPath}: ${error}`);
    }
  }

  static persistLogs(
    cwd: string,
    serviceName: ServiceName,
    hostPath: string,
    profileName: ProfileName,
  ): void {
    execSync(
      `docker compose --profile ${profileName} logs ${serviceName} > ${hostPath} 2>&1`,
      {
        cwd,
        stdio: 'inherit',
      },
    );
  }

  static stopCompose(cwd: string, profileName: ProfileName): void {
    execSync(`docker compose --profile ${profileName} down`, {
      cwd,
      stdio: 'inherit',
    });
  }
}
