// @ts-check

let logger = require('zitadel/log');

/**
 * @example
 * ```js
 * printKeysDeep(ctx);
 * ```
 * @param {object} value
 * @param {string} path
 * @param {Array<any>} seen
 * @returns {void}
 */
function printKeysDeep(value, path = '', seen = []) {
  const label = path || '[root]';

  if (typeof value === 'function') {
    logger.log(label + ': [function]');
    return;
  }

  if (value === null || typeof value !== 'object') {
    logger.log(label + ': ' + value);
    return;
  }

  if (seen.indexOf(value) !== -1) {
    logger.log(label + ': [circular]');
    return;
  }

  seen.push(value);

  const keys = Object.keys(value);
  if (keys.length === 0) {
    logger.log(label + ': []');
    seen.pop();
    return;
  }

  for (const key of keys) {
    const newPath = path ? path + '.' + key : key;
    printKeysDeep(value[key], newPath, seen);
  }

  seen.pop();
}
