import { HTTP as CerbosHTTP } from '@cerbos/http';
import { Inject, Injectable } from '@nestjs/common';
import { CustomLoggerService } from 'nestjs-backend-common';

import {
  AUTH_MODULE_OPTIONS_TOKEN,
  type AuthModuleOptions,
} from '../auth.module-definition';
import {
  AuthzCheckParams,
  type IAuthorizationProvider,
} from '../interfaces';

/**
 * @description
 * Makes HTTP calls to a Cerbos PDP (Policy Decision Point) to evaluate ABAC policies.
 *
 * To switch to another authz engine (OPA, Cedar, etc.), create a new class implementing `IAuthorizationProvider` and swap `useClass` in `AuthModule`.
 */
@Injectable()
export class CerbosAuthorizationProvider implements IAuthorizationProvider {
  private readonly cerbos: InstanceType<typeof CerbosHTTP>;

  constructor(
    @Inject(AUTH_MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {
    this.cerbos = new CerbosHTTP(this.options.cerbosUrl);
    this.logger.log(
      `Cerbos client initialized with URL: ${this.options.cerbosUrl}`,
    );
  }

  async isAllowed(params: AuthzCheckParams): Promise<boolean> {
    const {
      principal,
      resource,
      resourceId,
      action,
      resourceAttributes,
    } = params;

    try {
      const result = await this.cerbos.checkResource({
        principal: {
          id: principal.sub,
          roles:
            principal.roles.length > 0
              ? principal.roles
              : ['anonymous'],
          attr: {
            email: principal.email,
            orgId: principal.orgId ?? '',
            ...principal.metadata,
          },
        },
        resource: {
          kind: resource,
          id: resourceId,
          attr: resourceAttributes ?? {},
        },
        actions: [action],
      });
      const allowed = result.isAllowed(action) ?? false;

      this.logger.debug(
        `Cerbos check: principal=${principal.sub} action=${action} resource=${resource}/${resourceId} => ${allowed ? 'ALLOW' : 'DENY'}`,
      );

      return allowed;
    } catch (error) {
      this.logger.error(`Cerbos check failed: ${error}`);
      return false;
    }
  }
}
