import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertProblemTransition} from '@/lib/problem-management';
import {demoProblemRecords,isLocalDemo} from '@/lib/demo-data';

export async function GET(_:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params;if(isLocalDemo()){let d=demoProblemRecords.find(p=>p.id===id);return d?NextResponse.json(d):NextResponse.json({error:'NOT_FOUND'},{status:404})}let u=await requireUser('problem:manage'),problem=await prisma.problem.findFirst({where:{id,tenantId:u.tenantId},include:{owner:{select:{id:true,name:true}},incidents:{include:{ticket:true}}}});return problem?NextResponse.json(problem):NextResponse.json({error:'NOT_FOUND'},{status:404})}
export async function PATCH(req:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('problem:manage'),body=await req.json(),old=await prisma.problem.findFirst({where:{id,tenantId:u.tenantId}});if(!old)return NextResponse.json({error:'NOT_FOUND'},{status:404});if(body.status)assertProblemTransition(old.status,body.status);let updated=await prisma.problem.update({where:{id},data:body});return NextResponse.json(updated)}
export async function DELETE(_:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('problem:manage');await prisma.problem.deleteMany({where:{id,tenantId:u.tenantId}});return NextResponse.json({ok:true})}
