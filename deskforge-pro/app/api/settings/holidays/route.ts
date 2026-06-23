import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';

const schema=z.object({date:z.coerce.date(),description:z.string().min(2).max(160)});

export async function GET(){let u=await requireUser('settings:admin'),holidays=await prisma.holiday.findMany({where:{tenantId:u.tenantId},orderBy:{date:'asc'}});return NextResponse.json({holidays})}
export async function POST(req:NextRequest){let u=await requireUser('settings:admin'),data=schema.parse(await req.json()),holiday=await prisma.holiday.create({data:{...data,tenantId:u.tenantId}});return NextResponse.json(holiday,{status:201})}
export async function DELETE(req:NextRequest){let u=await requireUser('settings:admin'),id=req.nextUrl.searchParams.get('id');if(!id)return NextResponse.json({error:'ID_REQUIRED'},{status:400});await prisma.holiday.deleteMany({where:{id,tenantId:u.tenantId}});return NextResponse.json({ok:true})}
