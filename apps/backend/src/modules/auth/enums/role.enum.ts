/**
 * @description Application roles with implicit hierarchy
 *
 * Hierarchy: ADMIN > WRITER > USER
 */
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  WRITER = 'WRITER',
}

/**
 * @description Role hierarchy levels (higher number = more privileges)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 3,
  [Role.WRITER]: 2,
  [Role.USER]: 1,
};
