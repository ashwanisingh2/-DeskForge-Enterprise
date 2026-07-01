import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertChangeTransition} from '@/lib/change-workflow';
import {demoChangeRecords,isLocalDemo} from '@/lib/demo-data';
import {demoChangeStore} from '@/lib/demo-store';

export async function GET(_:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  if(isLocalDemo()){
    const d=demoChangeStore.get(id)??demoChangeRecords.find(c=>c.id===id);
    return d?NextResponse.json(d):NextResponse.json({error:'NOT_FOUND'},{status:404});
  }
  let u=await requireUser('change:manage'),change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId},include:{requester:true,approvals:true}});
  return change?NextResponse.json(change):NextResponse.json({error:'NOT_FOUND'},{status:404});
}

export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  const body=await req.json();
  if(isLocalDemo()){
    const existing=demoChangeStore.get(id);
    if(!existing)return NextResponse.json({error:'NOT_FOUND'},{status:404});
    if(body.status)assertChangeTransition(existing.status,body.status);
    const updated={...existing,...body};
    demoChangeStore.set(id,updated);
    return NextResponse.json(updated);
  }
  let u=await requireUser('change:manage'),old=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});
  if(!old)return NextResponse.json({error:'NOT_FOUND'},{status:404});
  if(body.status)assertChangeTransition(old.status,body.status);
  let updated=await prisma.changeRequest.update({where:{id},data:body});
  return NextResponse.json(updated);
}

export async function DELETE(_:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  if(isLocalDemo()){demoChangeStore.delete(id);return NextResponse.json({ok:true});}
  let u=await requireUser('change:manage');
  await prisma.changeRequest.deleteMany({where:{id,tenantId:u.tenantId,status:'DRAFT'}});
  return NextResponse.json({ok:true});
}
