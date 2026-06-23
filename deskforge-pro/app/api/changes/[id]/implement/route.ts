import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertChangeTransition} from '@/lib/change-workflow';

export async function POST(_:Request,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage'),change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});if(!change)return NextResponse.json({error:'NOT_FOUND'},{status:404});assertChangeTransition(change.status,'IMPLEMENTED');let updated=await prisma.changeRequest.update({where:{id},data:{status:'IMPLEMENTED'}});return NextResponse.json(updated)}
