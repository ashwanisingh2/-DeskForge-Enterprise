export const permissions={
 ADMIN:['*'],
 AGENT:['ticket:create','ticket:read:any','ticket:update','comment:create','asset:read','change:manage','problem:manage','kb:write','report:view'],
 END_USER:['ticket:create','ticket:read:own','comment:create','kb:read'],
 VIEWER:['ticket:read:any','kb:read','report:view']
} as const;
export type AppRole=keyof typeof permissions;
export type Permission='ticket:create'|'ticket:read:any'|'ticket:read:own'|'ticket:update'|'ticket:delete'|'comment:create'|'user:manage'|'settings:admin'|'report:view'|'asset:read'|'asset:admin'|'change:manage'|'problem:manage'|'catalog:manage'|'kb:read'|'kb:write';
export function can(role:AppRole,permission:Permission){let grants=permissions[role] as readonly string[];return grants.includes('*')||grants.includes(permission)}
export function assertPermission(role:AppRole,permission:Permission){if(!can(role,permission)){let e=new Error('FORBIDDEN');(e as any).status=403;throw e}}
