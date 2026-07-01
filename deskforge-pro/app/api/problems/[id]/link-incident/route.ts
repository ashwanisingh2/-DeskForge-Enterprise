import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {isLocalDemo} from '@/lib/demo-data';

export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  const {ticketId}=await req.json();
  if(isLocalDemo())return NextResponse.json({problemId:id,ticketId},{status:201});
  let u=await requireUser('problem:manage');
  let [problem,ticket]=await Promise.all([prisma.problem.findFirst({where:{id,tenantId:u.tenantId}}),prisma.ticket.findFirst({where:{id:ticketId,tenantId:u.tenantId,deletedAt:null}})]);
  if(!problem||!ticket)return NextResponse.json({error:'NOT_FOUND'},{status:404});
  let link=await prisma.problemIncident.upsert({where:{problemId_ticketId:{problemId:id,ticketId}},update:{},create:{problemId:id,ticketId}});
  return NextResponse.json(link,{status:201});
}

export async function DELETE(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  const ticketId=req.nextUrl.searchParams.get('ticketId');
  if(!ticketId)return NextResponse.json({error:'TICKET_REQUIRED'},{status:400});
  if(isLocalDemo())return NextResponse.json({ok:true});
  let u=await requireUser('problem:manage');
  let problem=await prisma.problem.findFirst({where:{id,tenantId:u.tenantId}});
  if(!problem)return NextResponse.json({error:'NOT_FOUND'},{status:404});
  await prisma.problemIncident.deleteMany({where:{problemId:id,ticketId}});
  return NextResponse.json({ok:true});
}
