import {Prisma,PrismaClient} from '@prisma/client';
import {prisma} from './prisma';

export async function setTenantContext(tenantId:string,client:PrismaClient|Prisma.TransactionClient=prisma){
  if(!tenantId)throw new Error('TENANT_REQUIRED');
  await client.$executeRaw`SELECT set_tenant_context(${tenantId})`;
}

export async function withTenantContext<T>(tenantId:string,fn:(tx:Prisma.TransactionClient)=>Promise<T>){
  return prisma.$transaction(async tx=>{
    await setTenantContext(tenantId,tx);
    return fn(tx);
  });
}
