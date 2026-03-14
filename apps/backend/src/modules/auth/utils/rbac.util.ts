import { Role, ROLE_HIERARCHY } from '../enums';

/**
 * @description Check if user has at least the minimum required role based on hierarchy
 *
 * @example
 * hasMinimumRole(['writer'], Role.USER) // true (writer >= user)
 * hasMinimumRole(['user'], Role.WRITER) // false (user < writer)
 * hasMinimumRole(['admin'], Role.WRITER) // true (admin >= writer)
 */
export function hasMinimumRole(
  userRoles: string[],
  minimumRole: Role,
): boolean {
  // Get the highest role level the user has
  const userLevel = Math.max(
    ...userRoles.map((role) => ROLE_HIERARCHY[role as Role] || 0),
  );

  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= requiredLevel;
}

/**
 * @description Check if user has admin role
 */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes(Role.ADMIN);
}

/**
 * @description Check if user has writer role or higher
 */
export function isWriterOrHigher(userRoles: string[]): boolean {
  return hasMinimumRole(userRoles, Role.WRITER);
}
