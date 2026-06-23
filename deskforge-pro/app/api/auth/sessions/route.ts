import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';

export async function GET(){
  let user=await requireUser();
  let sessions=await prisma.refreshToken.findMany({where:{userId:user.id,revokedAt:null,expiresAt:{gt:new Date()}},select:{id:true,createdAt:true,expiresAt:true,deviceInfo:true},orderBy:{createdAt:'desc'}});
  return NextResponse.json({sessions});
}
