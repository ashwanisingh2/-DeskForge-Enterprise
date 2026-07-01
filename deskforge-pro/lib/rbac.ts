/**
 * Role-based access control (RBAC) permission matrix.
 * `ADMIN` holds the wildcard `*` (all permissions); other roles hold explicit grants.
 */
export const permissions = {
  ADMIN: ['*'],
  AGENT: [
    'ticket:create',
    'ticket:read:any',
    'ticket:update',
    'comment:create',
    'asset:read',
    'change:manage',
    'problem:manage',
    'kb:write',
    'report:view',
  ],
  END_USER: ['ticket:create', 'ticket:read:own', 'comment:create', 'kb:read'],
  VIEWER: ['ticket:read:any', 'kb:read', 'report:view'],
} as const;

export type AppRole = keyof typeof permissions;

export type Permission =
  | 'ticket:create'
  | 'ticket:read:any'
  | 'ticket:read:own'
  | 'ticket:update'
  | 'ticket:delete'
  | 'comment:create'
  | 'user:manage'
  | 'settings:admin'
  | 'report:view'
  | 'asset:read'
  | 'asset:admin'
  | 'change:manage'
  | 'problem:manage'
  | 'catalog:manage'
  | 'kb:read'
  | 'kb:write';

/** Returns true if the role holds the given permission (or the `*` wildcard). */
export function can(role: AppRole, permission: Permission) {
  const grants = permissions[role] as readonly string[];
  return grants.includes('*') || grants.includes(permission);
}

/** Throws a 403 FORBIDDEN error when the role lacks the given permission. */
export function assertPermission(role: AppRole, permission: Permission) {
  if (!can(role, permission)) {
    const error = new Error('FORBIDDEN') as Error & {status?: number};
    error.status = 403;
    throw error;
  }
}
