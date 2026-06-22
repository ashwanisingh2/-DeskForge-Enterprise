import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
  const now=new Date(),autoCloseBefore=new Date(now.getTime()-72*3600000),summary={breached:0,atRisk:0,closed:0};
  const active=await prisma.ticket.findMany({where:{deletedAt:null,status:{notIn:['RESOLVED','CLOSED']},dueDate:{not:null}},select:{id:true,tenantId:true,dueDate:true,createdAt:true,slaStatus:true,assigneeId:true,title:true}});
  for(const ticket of active){
    const total=ticket.dueDate!.getTime()-ticket.createdAt.getTime(),remaining=ticket.dueDate!.getTime()-now.getTime(),next=remaining<=0?'BREACHED':remaining/Math.max(total,1)<=.2?'AT_RISK':'ON_TRACK';
    if(next===ticket.slaStatus)continue;
    await prisma.$transaction(async tx=>{
      await tx.ticket.update({where:{id:ticket.id},data:{slaStatus:next}});
      const admin=await tx.user.findFirst({where:{tenantId:ticket.tenantId,role:'ADMIN',isActive:true}});
      if(!admin)return;
      await tx.auditLog.create({data:{tenantId:ticket.tenantId,userId:admin.id,action:'SLA_STATUS',entityType:'Ticket',entityId:ticket.id,oldValue:{slaStatus:ticket.slaStatus},newValue:{slaStatus:next}}});
      await tx.notification.create({data:{tenantId:ticket.tenantId,userId:ticket.assigneeId||admin.id,type:next==='BREACHED'?'sla_breached':'sla_warning',title:`${next==='BREACHED'?'SLA breached':'SLA at risk'}: ${ticket.id}`,message:ticket.title,ticketId:ticket.id}});
    });
    if(next==='BREACHED')summary.breached++;
    if(next==='AT_RISK')summary.atRisk++;
  }
  const resolved=await prisma.ticket.findMany({where:{deletedAt:null,status:'RESOLVED',resolvedAt:{lte:autoCloseBefore}},select:{id:true,tenantId:true}});
  for(const ticket of resolved){
    const actor=await prisma.user.findFirst({where:{tenantId:ticket.tenantId,role:'ADMIN',isActive:true}});if(!actor)continue;
    await prisma.$transaction([
      prisma.ticket.update({where:{id:ticket.id},data:{status:'CLOSED',closedAt:now,activityLogs:{create:{userId:actor.id,action:'auto_closed',detail:'Automatically closed 72 hours after resolution'}}}}),
      prisma.auditLog.create({data:{tenantId:ticket.tenantId,userId:actor.id,action:'AUTO_CLOSE',entityType:'Ticket',entityId:ticket.id,newValue:{status:'CLOSED'}}})
    ]);
    summary.closed++;
  }
  return NextResponse.json({ok:true,processed:active.length,...summary,at:now.toISOString()});
}
