import {prisma} from '@/lib/prisma';
import {sendSLABreachEmail} from '@/lib/email';
import {getSLAStatus} from '@/lib/sla';

export async function runSlaCheck(){
  let summary={processed:0,warning:0,critical:0,breached:0};
  let tickets=await prisma.ticket.findMany({where:{deletedAt:null,status:{notIn:['RESOLVED','CLOSED','PENDING_CUSTOMER','ON_HOLD']},dueDate:{not:null}},include:{assignee:true,requester:true}});
  for(let ticket of tickets){
    summary.processed++;
    let next=getSLAStatus(ticket as any) as any;
    if(next===ticket.slaStatus)continue;
    await prisma.$transaction(async tx=>{
      await tx.ticket.update({where:{id:ticket.id},data:{slaStatus:next}});
      let admin=await tx.user.findFirst({where:{tenantId:ticket.tenantId,role:'ADMIN',isActive:true}});
      if(admin)await tx.auditLog.create({data:{tenantId:ticket.tenantId,userId:admin.id,action:'SLA_STATUS',entityType:'Ticket',entityId:ticket.id,oldValue:{slaStatus:ticket.slaStatus},newValue:{slaStatus:next}}});
      if(ticket.assigneeId)await tx.notification.create({data:{tenantId:ticket.tenantId,userId:ticket.assigneeId,type:next==='BREACHED'?'sla_breached':'sla_warning',title:`SLA ${next.toLowerCase()}: ${ticket.id}`,message:ticket.title,ticketId:ticket.id}});
    });
    if(next==='WARNING')summary.warning++;
    if(next==='CRITICAL')summary.critical++;
    if(next==='BREACHED'){summary.breached++;let recipient=ticket.assignee||ticket.requester;if(recipient)await sendSLABreachEmail(ticket,recipient)}
  }
  return summary;
}

export async function runAutoClose(){
  let now=new Date(),cutoff=new Date(now.getTime()-72*36e5),closed=0;
  let tickets=await prisma.ticket.findMany({where:{deletedAt:null,status:'RESOLVED',resolvedAt:{lte:cutoff}},select:{id:true,tenantId:true}});
  for(let ticket of tickets){
    let actor=await prisma.user.findFirst({where:{tenantId:ticket.tenantId,role:'ADMIN',isActive:true}});
    if(!actor)continue;
    await prisma.$transaction([
      prisma.ticket.update({where:{id:ticket.id},data:{status:'CLOSED',closedAt:now,activityLogs:{create:{userId:actor.id,action:'auto_closed',detail:'Automatically closed 72 hours after resolution'}}}}),
      prisma.auditLog.create({data:{tenantId:ticket.tenantId,userId:actor.id,action:'AUTO_CLOSE',entityType:'Ticket',entityId:ticket.id,newValue:{status:'CLOSED'}}})
    ]);
    closed++;
  }
  return{closed};
}

export async function runNotification(job:any){
  let {to,subject,html}=job.data||{};
  if(!to||!subject)return{skipped:true};
  let {Resend}=await import('resend');
  if(!process.env.RESEND_API_KEY)return{skipped:true};
  await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.EMAIL_FROM||'DeskForge Pro <support@example.com>',to,subject,html});
  return{sent:true};
}
