import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';

const row=z.object({dayOfWeek:z.number().int().min(0).max(6),startHour:z.number().int().min(0).max(23),endHour:z.number().int().min(1).max(24)}).refine(x=>x.endHour>x.startHour,{message:'endHour must be after startHour'});
const schema=z.object({hours:z.array(row).max(7)});

export async function GET(){let u=await requireUser('settings:admin'),hours=await prisma.businessHour.findMany({where:{tenantId:u.tenantId},orderBy:{dayOfWeek:'asc'}});return NextResponse.json({hours})}
export async function PUT(req:NextRequest){let u=await requireUser('settings:admin'),{hours}=schema.parse(await req.json());await prisma.$transaction(async tx=>{await tx.businessHour.deleteMany({where:{tenantId:u.tenantId}});await tx.businessHour.createMany({data:hours.map(h=>({...h,tenantId:u.tenantId}))})});return NextResponse.json({ok:true,hours})}
