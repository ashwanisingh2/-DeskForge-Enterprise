import {headers} from 'next/headers';
export async function tenantIdFromRequest(){let id=(await headers()).get('x-tenant-id');if(!id)throw new Error('TENANT_REQUIRED');return id}
export function tenantWhere<T extends object>(tenantId:string,where:T){return{...where,tenantId}}
