import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {ticketSchema} from '@/lib/validations';
import {calculateDueDate} from '@/lib/sla';
import {getSLAStatus} from '@/lib/sla';
import {sendTicketAssignedEmail,sendTicketCreatedEmail} from '@/lib/email';
import {structuredError} from '@/lib/api-errors';
import {demoTickets,isLocalDemo} from '@/lib/demo-data';

// Enum-typed columns are stored upper snake-case; free-form columns must not be transformed.
const enumFilters=['status','priority','slaStatus'] as const;
const rawFilters=['category','subcategory','assigneeId','requesterId'] as const;
const sortableColumns=new Set(['createdAt','updatedAt','priority','status','dueDate','title','id']);

export async function GET(req:NextRequest){
  try{
    if(isLocalDemo())return NextResponse.json({tickets:demoTickets,total:demoTickets.length,page:1,totalPages:1});
    let u=await requireUser(),q=req.nextUrl.searchParams;
    let page=Math.max(1,+(q.get('page')||1)),limit=Math.min(100,Math.max(1,+(q.get('limit')||25)));
    let where:any={deletedAt:null,tenantId:u.tenantId};
    if(u.role==='END_USER')where.requesterId=u.id;
    for(let k of enumFilters)if(q.get(k))where[k]=q.get(k)!.toUpperCase().replace(/-/g,'_');
    for(let k of rawFilters)if(q.get(k)){let v=q.get(k)!;where[k]=v==='unassigned'?null:v}
    let search=q.get('search')?.trim();
    if(search)where.OR=['id','title','description'].map(k=>({[k]:{contains:search,mode:'insensitive'}}));
    if(q.get('dateFrom')||q.get('dateTo'))where.createdAt={...(q.get('dateFrom')&&{gte:new Date(q.get('dateFrom')!)}),...(q.get('dateTo')&&{lte:new Date(q.get('dateTo')!)})};
    let sortByParam=q.get('sortBy')||'createdAt',sortBy=sortableColumns.has(sortByParam)?sortByParam:'createdAt';
    let sortOrder=q.get('sortOrder')==='asc'?'asc':'desc';
    let[tickets,total]=await prisma.$transaction([
      prisma.ticket.findMany({where,include:{assignee:{select:{id:true,name:true}},requester:{select:{id:true,name:true}}},skip:(page-1)*limit,take:limit,orderBy:{[sortBy]:sortOrder}}),
      prisma.ticket.count({where}),
    ]);
    let now=new Date(),withSla=tickets.map(t=>({...t,slaStatus:getSLAStatus({dueDate:t.dueDate,status:t.status,createdAt:t.createdAt},now)}));
    return NextResponse.json({tickets:withSla,total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))});
  }catch(e:any){
    return NextResponse.json({error:{code:'UNAUTHORIZED',message:'Unauthorized'}},{status:e?.message==='FORBIDDEN'?403:401});
  }
}

export async function POST(req:NextRequest){
  try{
    if(isLocalDemo()){let data=ticketSchema.parse(await req.json()),ticket={...demoTickets[0],...data,id:`TKT-${String(demoTickets.length+1).padStart(4,'0')}`,requester:{name:'Ashwani Sharma'},assignee:null,status:'OPEN',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),comments:[],activityLogs:[]};return NextResponse.json(ticket,{status:201})}
    let u=await requireUser('ticket:create'),data=ticketSchema.parse(await req.json());
    // Atomic, race-free ticket ID via Postgres sequence (DF-2026-012).
    let id: string;
    try {
      const seq = await prisma.$queryRawUnsafe<{next: bigint}[]>("SELECT nextval('ticket_seq') AS next");
      id = `TKT-${String(Number(seq[0].next)).padStart(4, '0')}`;
    } catch {
      // Fallback for databases where the sequence is not yet provisioned.
      const last = await prisma.ticket.findFirst({orderBy: {id: 'desc'}, select: {id: true}});
      id = `TKT-${String(+(last?.id.split('-')[1] || 0) + 1).padStart(4, '0')}`;
    }
    let ticket = await prisma.ticket.create({data:{...data,id,tenantId:u.tenantId,requesterId:u.id,dueDate:calculateDueDate(data.priority),activityLogs:{create:{action:'created',detail:'Ticket created',userId:u.id}}},include:{requester:true,assignee:true}});
    await prisma.auditLog.create({data:{tenantId:u.tenantId,userId:u.id,action:'CREATE',entityType:'Ticket',entityId:ticket.id,newValue:ticket as any}});
    await sendTicketCreatedEmail(ticket,ticket.requester);
    if(ticket.assignee)await sendTicketAssignedEmail(ticket,ticket.assignee);
    return NextResponse.json(ticket,{status:201});
  }catch(e:any){
    return NextResponse.json(structuredError(e),{status:e.message==='UNAUTHORIZED'?401:400});
  }
}
