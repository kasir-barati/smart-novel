// @ts-check

/**
 * @param {object} grantsInfo
 * @param {number} [grantsInfo.count] - Total number of grants (may be inconsistent with "grants.length" in some runtimes).
 * @param {Array<{roles?: string[]}|null|undefined>} [grantsInfo.grants] - List of grants; each grant may include a "roles" array.
 * @param {string} roleKey - The role key to look for (e.g. "user").
 * @returns {boolean}
 */
function hasRole(grantsInfo, roleKey) {
  if (!grantsInfo || !grantsInfo.grants || grantsInfo.count <= 0) {
    return false;
  }

  for (let i = 0; i < grantsInfo.grants.length; i++) {
    const g = grantsInfo.grants[i];
    if (!g || !g.roles) continue;

    for (let j = 0; j < g.roles.length; j++) {
      if (g.roles[j] === roleKey) return true;
    }
  }

  return false;
}
