import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';

export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage'),{decision='APPROVED',comment}=await req.json().catch(()=>({}));let change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId},include:{approvals:true}});if(!change)return NextResponse.json({error:'NOT_FOUND'},{status:404});await prisma.approval.updateMany({where:{changeId:id,approverId:u.id},data:{status:decision,comment,decidedAt:new Date()}});let approvals=await prisma.approval.findMany({where:{changeId:id}}),status=decision==='REJECTED'?'REJECTED':approvals.every(a=>a.status==='APPROVED')?'APPROVED':change.status;let updated=await prisma.changeRequest.update({where:{id},data:{status}});return NextResponse.json(updated)}
