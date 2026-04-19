// @ts-check

const logger = require('zitadel/log');

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
  api.v1.claims.setClaim("roles", ["user"]);
};
