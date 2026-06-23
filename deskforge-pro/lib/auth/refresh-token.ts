import {createHash,randomBytes} from 'crypto';
import {prisma} from '@/lib/prisma';

export const refreshCookieName='deskforge_refresh';
export const accessCookieName='deskforge_access';
const maxSessions=3,refreshDays=30;
export function hashRefreshToken(token:string){return createHash('sha256').update(token).digest('hex')}

export async function createRefreshToken(user:{id:string;tenantId:string},deviceInfo?:string){
  let token=randomBytes(48).toString('base64url'),tokenHash=hashRefreshToken(token),expiresAt=new Date(Date.now()+refreshDays*864e5);
  await prisma.$transaction(async tx=>{
    await tx.refreshToken.create({data:{tokenHash,userId:user.id,tenantId:user.tenantId,expiresAt,deviceInfo}});
    let active=await tx.refreshToken.findMany({where:{userId:user.id,revokedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'},skip:maxSessions});
    if(active.length)await tx.refreshToken.updateMany({where:{id:{in:active.map(x=>x.id)}},data:{revokedAt:new Date()}});
  });
  return {token,expiresAt};
}

export async function validateRefreshToken(token:string){
  let row=await prisma.refreshToken.findUnique({where:{tokenHash:hashRefreshToken(token)},include:{user:true}});
  if(!row||row.revokedAt||row.expiresAt<=new Date()||!row.user.isActive)throw new Error('INVALID_REFRESH_TOKEN');
  return row;
}

export async function rotateRefreshToken(token:string,deviceInfo?:string){
  let row=await validateRefreshToken(token);
  await prisma.refreshToken.update({where:{id:row.id},data:{revokedAt:new Date()}});
  let next=await createRefreshToken({id:row.userId,tenantId:row.tenantId},deviceInfo);
  return {refresh:next,user:row.user};
}

export async function revokeAllUserSessions(userId:string){
  await prisma.refreshToken.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});
}
