import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertChangeTransition} from '@/lib/change-workflow';

export async function GET(_:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage'),change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId},include:{requester:true,approvals:true}});return change?NextResponse.json(change):NextResponse.json({error:'NOT_FOUND'},{status:404})}
export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage'),body=await req.json(),old=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});if(!old)return NextResponse.json({error:'NOT_FOUND'},{status:404});if(body.status)assertChangeTransition(old.status,body.status);let updated=await prisma.changeRequest.update({where:{id},data:body});return NextResponse.json(updated)}
export async function DELETE(_:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage');await prisma.changeRequest.deleteMany({where:{id,tenantId:u.tenantId,status:'DRAFT'}});return NextResponse.json({ok:true})}
