// @ts-check

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * @param {string} projectId - The project to grant the role in
 * @param {string} botPat - A service-account PAT with Management API permissions
 * @returns {string} The JavaScript source for the Zitadel Action
 */
export function buildPostRegistrationActionScript(projectId, botPat) {
  const hasRole = readFileSync(
    join(process.cwd(), 'src', 'actions', 'has-role.mjs'),
    { encoding: 'utf-8' },
  );

  return `
const http = require('zitadel/http');
const logger = require('zitadel/log');

${hasRole}

/**
 * @param {object} ctx
 * @param {object} ctx.v1
 * @param {() => {id: string}} ctx.v1.getUser
 * @param {object} ctx.v1.user
 * @param {function} ctx.v1.user.grants
 * @param {function} ctx.v1.user.getMetadata
 * @param {object} ctx.v1.org
 * @param {function} ctx.v1.org.getMetadata
 * @param {object} ctx.v1.claims
 * @param {function} ctx.v1.claims.sub
 * @param {object} ctx.v1.application
 * @param {function} ctx.v1.application.getClientId
 * @param {object} api
 * @param {object} api.v1
 * @param {object} api.v1.user
 * @param {function} api.v1.user.setMetadata
 * @param {object} api.v1.claims
 * @param {function} api.v1.claims.setClaim
 * @param {function} api.v1.claims.appendLogIntoClaims
 * @param {object} api.v1.userinfo
 * @param {function} api.v1.userinfo.setClaim
 * @param {function} api.v1.userinfo.appendLogIntoClaims
 * @returns {void}
 */
function postSelfRegistrationToExtendUserClaims(ctx, api) {
  const user = ctx.v1.getUser();
  const grantsInfo = ctx.v1.user && ctx.v1.user.grants; // 👈 If ZITADEL populated grants in this action trigger, use it.

  logger.log('Auto-granting user role to self-registered user: ' + user.id);


  if (hasRole(grantsInfo, 'user')) {
    return;
  }

  let response = http.fetch('http://traefik:80/management/v1/users/' + user.id + '/grants', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${botPat}', // 👈 Do I need this since this is happening in internal authentication flow.
      'Content-Type': 'application/json',
    },
    body: {
      projectId: '${projectId}',
      roleKeys: ['user'],
    },
  });

  if (response.status >= 200 && response.status < 300) {
    logger.log('Successfully granted user role to user ' + user.id);
    return;
  };

  logger.log('Failed to grant role. Status: ' + response.status + ' Body: ' + response.body);
};
`;
}
