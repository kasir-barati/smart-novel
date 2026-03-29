/**
 * @description Application roles with implicit hierarchy
 *
 * Hierarchy: admin > writer > user
 */
export enum Role {
  admin = 'admin',
  user = 'user',
  writer = 'writer',
}

/**
 * @description Role hierarchy levels (higher number = more privileges)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.admin]: 3,
  [Role.writer]: 2,
  [Role.user]: 1,
};
