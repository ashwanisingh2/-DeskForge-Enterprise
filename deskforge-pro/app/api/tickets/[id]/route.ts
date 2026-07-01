import {NextRequest,NextResponse} from 'next/server';
import {Prisma,TicketStatus} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {allowedTransitions,assertTransition,lifecycleDates} from '@/lib/ticket-lifecycle';
import {demoTickets,isLocalDemo} from '@/lib/demo-data';

// In-memory demo ticket store — persists for the lifetime of the dev server process.
const demoStore = new Map<string, any>(demoTickets.map(t => [t.id, {...t}]));

const allowed=['title','description','status','priority','assigneeId','category','subcategory','impact','urgency','checklist','resolutionNote'] as const;
function failure(error:unknown){let message=error instanceof Error?error.message:'UNKNOWN',al=(error as any)?.allowed;let status=message==='UNAUTHORIZED'?401:message==='FORBIDDEN'||message==='TRANSITION_FORBIDDEN'?403:message.startsWith('INVALID_TRANSITION')?400:400;return NextResponse.json({error:message,allowedTransitions:al},{status})}

export async function GET(_:NextRequest,ctx:{params:Promise<{id:string}>}){
  const {id}=await ctx.params;
  try{
    if(isLocalDemo()){
      const t=demoStore.get(id);
      return t
        ? NextResponse.json({...t,allowedTransitions:allowedTransitions(t.status),comments:[],activityLogs:[],attachments:[],relatedTo:[],relatedFrom:[]})
        : NextResponse.json({error:'NOT_FOUND'},{status:404});
    }
    let u=await requireUser(),ticket=await prisma.ticket.findFirst({where:{id,tenantId:u.tenantId,deletedAt:null,...(u.role==='END_USER'?{requesterId:u.id}:{})},include:{requester:true,assignee:true,comments:{include:{author:true},orderBy:{createdAt:'asc'}},activityLogs:{include:{user:true},orderBy:{createdAt:'desc'}},attachments:true,relatedTo:{include:{ticketB:true}},relatedFrom:{include:{ticketA:true}}}});
    return ticket?NextResponse.json({...ticket,allowedTransitions:allowedTransitions(ticket.status)}):NextResponse.json({error:'NOT_FOUND'},{status:404});
  }catch(e){return failure(e)}}

export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  const {id}=await ctx.params;
  try{
    if(isLocalDemo()){
      const old=demoStore.get(id);
      if(!old)return NextResponse.json({error:'NOT_FOUND'},{status:404});
      const body=await req.json();
      const data:Record<string,unknown>={};
      for(const key of allowed)if(key in body)data[key]=body[key];
      if(data.status){
        assertTransition(old.status as TicketStatus,data.status as TicketStatus);
        Object.assign(data,lifecycleDates(data.status as TicketStatus));
      }
      const updated={...old,...data,updatedAt:new Date().toISOString()};
      demoStore.set(id,updated);
      return NextResponse.json({...updated,allowedTransitions:allowedTransitions(updated.status as TicketStatus),comments:[],activityLogs:[],attachments:[],relatedTo:[],relatedFrom:[]});
    }
    let u=await requireUser('ticket:update'),old=await prisma.ticket.findFirstOrThrow({where:{id,tenantId:u.tenantId,deletedAt:null}}),body=await req.json(),data:Record<string,unknown>={};for(let key of allowed)if(key in body)data[key]=body[key];if(data.status){assertTransition(old.status,data.status as TicketStatus,u,old);Object.assign(data,lifecycleDates(data.status as TicketStatus));if(data.status==='PENDING_CUSTOMER'||data.status==='ON_HOLD')await prisma.sLAClockHistory.create({data:{ticketId:old.id,event:'PAUSE',reason:String(data.status)}});if(old.status==='PENDING_CUSTOMER'||old.status==='ON_HOLD')await prisma.sLAClockHistory.create({data:{ticketId:old.id,event:'RESUME',reason:String(data.status)}})}let changes=Object.keys(data).filter(key=>String((old as any)[key])!==String(data[key]));if(!changes.length)return NextResponse.json({...old,allowedTransitions:allowedTransitions(old.status)});let ticket=await prisma.$transaction(async tx=>{let updated=await tx.ticket.update({where:{id:old.id},data:{...data,activityLogs:{create:changes.map(key=>({action:`${key}_changed`,detail:`${key} updated`,oldValue:String((old as any)[key]??''),newValue:String(data[key]??''),userId:u.id}))}}});let oldValue=Object.fromEntries(changes.map(k=>[k,(old as any)[k]])) as Prisma.InputJsonObject,newValue=Object.fromEntries(changes.map(k=>[k,data[k] as Prisma.InputJsonValue])) as Prisma.InputJsonObject;await tx.auditLog.create({data:{tenantId:u.tenantId,userId:u.id,action:'UPDATE',entityType:'Ticket',entityId:old.id,oldValue,newValue}});return updated});return NextResponse.json({...ticket,allowedTransitions:allowedTransitions(ticket.status)});
  }catch(e){return failure(e)}}

export async function DELETE(_:NextRequest,ctx:{params:Promise<{id:string}>}){
  const {id}=await ctx.params;
  try{
    if(isLocalDemo()){
      if(!demoStore.has(id))return NextResponse.json({error:'NOT_FOUND'},{status:404});
      demoStore.delete(id);
      return NextResponse.json({ok:true});
    }
    let u=await requireUser('ticket:delete'),result=await prisma.$transaction(async tx=>{let ticket=await tx.ticket.findFirstOrThrow({where:{id,tenantId:u.tenantId,deletedAt:null}});await tx.ticket.update({where:{id:ticket.id},data:{deletedAt:new Date()}});await tx.auditLog.create({data:{tenantId:u.tenantId,userId:u.id,action:'DELETE',entityType:'Ticket',entityId:ticket.id,oldValue:{title:ticket.title,status:ticket.status}}});return{ok:true}});return NextResponse.json(result);
  }catch(e){return failure(e)}}
