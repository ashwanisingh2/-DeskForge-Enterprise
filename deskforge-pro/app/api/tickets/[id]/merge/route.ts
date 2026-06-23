import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';

export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params,user=await requireUser('ticket:update'),{targetId}=await req.json();
  if(!targetId||targetId===id)return NextResponse.json({error:'INVALID_TARGET'},{status:400});
  let tickets=await prisma.ticket.findMany({where:{tenantId:user.tenantId,id:{in:[id,targetId]},deletedAt:null}});
  if(tickets.length!==2)return NextResponse.json({error:'NOT_FOUND'},{status:404});
  await prisma.$transaction([
    prisma.relatedTicket.create({data:{ticketAId:id,ticketBId:targetId,relationship:'DUPLICATE'}}),
    prisma.ticket.update({where:{id},data:{status:'CLOSED',closedAt:new Date(),activityLogs:{create:{userId:user.id,action:'merged',detail:`Merged into ${targetId}`}}}}),
    prisma.auditLog.create({data:{tenantId:user.tenantId,userId:user.id,action:'MERGE',entityType:'Ticket',entityId:id,newValue:{targetId}}})
  ]);
  return NextResponse.json({ok:true,targetId});
}
