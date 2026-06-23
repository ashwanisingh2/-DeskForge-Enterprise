import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {ticketSchema} from '@/lib/validations';
import {calculateDueDate} from '@/lib/sla';
import {sendTicketAssignedEmail,sendTicketCreatedEmail} from '@/lib/email';
import {structuredError} from '@/lib/api-errors';
import {demoTickets,isLocalDemo} from '@/lib/demo-data';

export async function GET(req:NextRequest){
  try{
    if(isLocalDemo())return NextResponse.json({tickets:demoTickets,total:demoTickets.length,page:1,totalPages:1});
    let u=await requireUser(),q=req.nextUrl.searchParams,page=Math.max(1,+(q.get('page')||1)),limit=Math.min(100,+(q.get('limit')||25)),where:any={deletedAt:null,tenantId:u.tenantId};
    if(u.role==='END_USER')where.requesterId=u.id;
    for(let k of ['status','priority','category','assigneeId','requesterId','slaStatus'])if(q.get(k))where[k]=q.get(k)!.toUpperCase().replace('-','_');
    if(q.get('search'))where.OR=['id','title','description'].map(k=>({[k]:{contains:q.get('search'),mode:'insensitive'}}));
    if(q.get('dateFrom')||q.get('dateTo'))where.createdAt={...(q.get('dateFrom')&&{gte:new Date(q.get('dateFrom')!)}),...(q.get('dateTo')&&{lte:new Date(q.get('dateTo')!)})};
    let[tickets,total]=await prisma.$transaction([prisma.ticket.findMany({where,include:{assignee:true,requester:true},skip:(page-1)*limit,take:limit,orderBy:{[q.get('sortBy')||'createdAt']:q.get('sortOrder')==='asc'?'asc':'desc'}}),prisma.ticket.count({where})]);
    return NextResponse.json({tickets,total,page,totalPages:Math.ceil(total/limit)});
  }catch{
    return NextResponse.json({error:{code:'UNAUTHORIZED',message:'Unauthorized'}},{status:401});
  }
}

export async function POST(req:NextRequest){
  try{
    if(isLocalDemo()){let data=ticketSchema.parse(await req.json()),ticket={...demoTickets[0],...data,id:`TKT-${String(demoTickets.length+1).padStart(4,'0')}`,requester:{name:'Ashwani Sharma'},assignee:null,status:'OPEN',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),comments:[],activityLogs:[]};return NextResponse.json(ticket,{status:201})}
    let u=await requireUser('ticket:create'),data=ticketSchema.parse(await req.json()),last=await prisma.ticket.findFirst({orderBy:{createdAt:'desc'},select:{id:true}}),id=`TKT-${String((+(last?.id.split('-')[1]||0))+1).padStart(4,'0')}`,ticket=await prisma.ticket.create({data:{...data,id,tenantId:u.tenantId,requesterId:u.id,dueDate:calculateDueDate(data.priority),activityLogs:{create:{action:'created',detail:'Ticket created',userId:u.id}}},include:{requester:true,assignee:true}});
    await prisma.auditLog.create({data:{tenantId:u.tenantId,userId:u.id,action:'CREATE',entityType:'Ticket',entityId:id,newValue:ticket as any}});
    await sendTicketCreatedEmail(ticket,ticket.requester);
    if(ticket.assignee)await sendTicketAssignedEmail(ticket,ticket.assignee);
    return NextResponse.json(ticket,{status:201});
  }catch(e:any){
    return NextResponse.json(structuredError(e),{status:e.message==='UNAUTHORIZED'?401:400});
  }
}
