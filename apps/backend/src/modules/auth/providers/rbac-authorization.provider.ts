import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from 'nestjs-backend-common';

import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../enums';
import {
  AuthzCheckParams,
  type IAuthorizationProvider,
} from '../interfaces';
import { hasMinimumRole, isAdmin } from '../utils';

/**
 * @description
 * RBAC authorization provider that implements role-based access control with ownership checks.
 *
 * **Role Hierarchy:** admin > writer > user
 *
 * **Permission Model:**
 * - `novel:read` - Any authenticated user (user role or higher)
 * - `novel:create` - writer or admin
 * - `novel:update` - admin OR (writer AND owner)
 * - `novel:delete` - admin OR (writer AND owner)
 * - `chapter:read` - Any authenticated user (user role or higher)
 * - `chapter:update` - admin OR (writer AND owns parent novel)
 *
 * Roles are extracted from IAuthUser.roles[] (populated by Zitadel tokens).
 */
@Injectable()
export class RbacAuthorizationProvider implements IAuthorizationProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.log('RBAC authorization provider initialized');
  }

  async isAllowed(params: AuthzCheckParams): Promise<boolean> {
    const { principal, resource, resourceId, action } = params;

    try {
      let allowed = false;

      // Route to appropriate permission check based on resource type
      switch (resource) {
        case 'novel':
          allowed = await this.checkNovelPermission(
            principal.sub,
            principal.roles,
            resourceId,
            action,
          );
          break;
        case 'chapter':
          allowed = await this.checkChapterPermission(
            principal.sub,
            principal.roles,
            resourceId,
            action,
          );
          break;
        default:
          this.logger.warn(
            `Unknown resource type: ${resource}. Denying access.`,
          );
          allowed = false;
      }

      this.logger.debug(
        `RBAC check: principal=${principal.sub} roles=[${principal.roles.join(',')}] action=${action} resource=${resource}/${resourceId} => ${allowed ? 'ALLOW' : 'DENY'}`,
      );

      return allowed;
    } catch (error) {
      this.logger.error(`RBAC check failed: ${error}`);
      return false;
    }
  }

  /**
   * @description Check permissions for novel resources
   */
  private async checkNovelPermission(
    userId: string,
    userRoles: string[],
    novelId: string,
    action: string,
  ): Promise<boolean> {
    this.logger.log(
      '{ userId, userRoles, novelId, action }: ' +
        JSON.stringify(
          { userId, userRoles, novelId, action },
          null,
          2,
        ),
    );

    switch (action) {
      case 'read':
        this.logger.log(
          'read: ' + hasMinimumRole(userRoles, Role.USER),
        );
        return hasMinimumRole(userRoles, Role.USER);
      case 'create':
        this.logger.log(
          'create: ' + hasMinimumRole(userRoles, Role.WRITER),
        );
        return hasMinimumRole(userRoles, Role.WRITER);
      case 'update':
      case 'delete':
        // Admins can do anything
        if (isAdmin(userRoles)) {
          this.logger.log('update/delete: admin => allow');
          return true;
        }

        // Writers can only update/delete their own novels
        if (hasMinimumRole(userRoles, Role.WRITER)) {
          const res = await this.isNovelOwner(userId, novelId);
          this.logger.log('update/delete: writer => ' + res);
          return res;
        }

        return false;
      default:
        this.logger.warn(`Unknown novel action: ${action}`);
        return false;
    }
  }

  /**
   * @description Check permissions for chapter resources
   * Chapters inherit permissions from their parent novel
   */
  private async checkChapterPermission(
    userId: string,
    userRoles: string[],
    chapterId: string,
    action: string,
  ): Promise<boolean> {
    switch (action) {
      case 'read':
        this.logger.log(
          'chapter read: ' + hasMinimumRole(userRoles, Role.USER),
        );
        return hasMinimumRole(userRoles, Role.USER);

      case 'update':
        // Admins can do anything
        if (isAdmin(userRoles)) {
          this.logger.log('chapter update: admin => allow');
          return true;
        }

        // Writers can only update chapters of novels they own
        if (hasMinimumRole(userRoles, Role.WRITER)) {
          // Fetch the chapter's parent novel and check ownership
          const chapter = await this.prisma.chapter.findUnique({
            where: { id: chapterId },
            select: {
              novel: {
                select: { ownerId: true },
              },
            },
          });

          this.logger.log(
            'Fetched chapter for ownership check: ' +
              JSON.stringify(chapter, null, 2),
          );

          if (!chapter) {
            this.logger.warn(`Chapter not found: ${chapterId}`);
            return false;
          }

          const isOwner = chapter.novel.ownerId === userId;
          this.logger.log('chapter update: writer => ' + isOwner);
          return isOwner;
        }

        return false;

      default:
        this.logger.warn(`Unknown chapter action: ${action}`);
        return false;
    }
  }

  /**
   * @description Check if user owns a novel
   */
  private async isNovelOwner(
    userId: string,
    novelId: string,
  ): Promise<boolean> {
    const novel = await this.prisma.novel.findUnique({
      where: { id: novelId },
      select: { ownerId: true },
    });

    if (!novel) {
      this.logger.warn(`Novel not found: ${novelId}`);
      return false;
    }

    return novel.ownerId === userId;
  }
}
