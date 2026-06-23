import {NextRequest,NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {sanitizeHtml} from '@/lib/sanitize';
import {normalizeFiveWhys} from '@/lib/problem-management';

const schema=z.object({rootCause:z.string().min(3).transform(sanitizeHtml),symptoms:z.string().optional().transform(x=>x?sanitizeHtml(x):x),contributingFactors:z.array(z.string()).default([]),workaround:z.string().optional().transform(x=>x?sanitizeHtml(x):x),fiveWhys:z.array(z.string()).default([]),isKnownError:z.boolean().default(false),kbArticleId:z.string().nullable().optional(),status:z.enum(['INVESTIGATING','IDENTIFIED','MITIGATED','CLOSED']).optional(),resolveLinkedIncidents:z.boolean().default(false)});
export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){let {id}=await ctx.params,u=await requireUser('problem:manage'),data=schema.parse(await req.json()),problem=await prisma.problem.findFirst({where:{id,tenantId:u.tenantId},include:{incidents:true}});if(!problem)return NextResponse.json({error:'NOT_FOUND'},{status:404});let updated=await prisma.$transaction(async tx=>{let p=await tx.problem.update({where:{id},data:{rootCause:data.rootCause,symptoms:data.symptoms,contributingFactors:data.contributingFactors as Prisma.InputJsonArray,workaround:data.workaround,fiveWhys:normalizeFiveWhys(data.fiveWhys) as Prisma.InputJsonArray,isKnownError:data.isKnownError,kbArticleId:data.kbArticleId,status:data.status||problem.status}});if((data.status==='CLOSED'||problem.status==='CLOSED')&&data.resolveLinkedIncidents)await tx.ticket.updateMany({where:{id:{in:problem.incidents.map(i=>i.ticketId)},tenantId:u.tenantId,status:{notIn:['CLOSED','RESOLVED']}},data:{status:'RESOLVED',resolvedAt:new Date()}});return p});return NextResponse.json(updated)}
