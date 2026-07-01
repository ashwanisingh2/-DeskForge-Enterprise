import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertChangeTransition} from '@/lib/change-workflow';
import {isLocalDemo} from '@/lib/demo-data';
import {demoChangeStore} from '@/lib/demo-store';

export async function POST(_:Request,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  if(isLocalDemo()){
    const change=demoChangeStore.get(id);
    if(!change)return NextResponse.json({error:'NOT_FOUND'},{status:404});
    const updated={...change,status:'IMPLEMENTED'};
    demoChangeStore.set(id,updated);
    return NextResponse.json(updated);
  }
  let u=await requireUser('change:manage'),change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});
  if(!change)return NextResponse.json({error:'NOT_FOUND'},{status:404});
  assertChangeTransition(change.status,'IMPLEMENTED');
  let updated=await prisma.changeRequest.update({where:{id},data:{status:'IMPLEMENTED'}});
  return NextResponse.json(updated);
}
