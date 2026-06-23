import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {assertChangeTransition} from '@/lib/change-workflow';

const schema=z.object({success:z.boolean(),actualDuration:z.number().int().positive(),issues:z.string().optional(),lessonsLearned:z.string().optional(),close:z.boolean().default(false)});
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('change:manage'),data=schema.parse(await req.json()),change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});if(!change)return NextResponse.json({error:'NOT_FOUND'},{status:404});assertChangeTransition(change.status,'REVIEWED');let reviewed=await prisma.changeRequest.update({where:{id},data:{status:data.close?'CLOSED':'REVIEWED',pirSuccess:data.success,actualDuration:data.actualDuration,pirIssues:data.issues,lessonsLearned:data.lessonsLearned}});return NextResponse.json(reviewed)}
