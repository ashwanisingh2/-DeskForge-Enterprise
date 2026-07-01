import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {demoHolidays,isLocalDemo} from '@/lib/demo-data';

const schema=z.object({date:z.coerce.date(),description:z.string().min(2).max(160)});

export async function GET(){if(isLocalDemo())return NextResponse.json({holidays:demoHolidays});let u=await requireUser('settings:admin'),holidays=await prisma.holiday.findMany({where:{tenantId:u.tenantId},orderBy:{date:'asc'}});return NextResponse.json({holidays})}
export async function POST(req:NextRequest){let data=schema.parse(await req.json());if(isLocalDemo())return NextResponse.json({id:'demo',...data},{status:201});let u=await requireUser('settings:admin'),holiday=await prisma.holiday.create({data:{...data,tenantId:u.tenantId}});return NextResponse.json(holiday,{status:201})}
export async function DELETE(req:NextRequest){let id=req.nextUrl.searchParams.get('id');if(!id)return NextResponse.json({error:'ID_REQUIRED'},{status:400});if(isLocalDemo())return NextResponse.json({ok:true});let u=await requireUser('settings:admin');await prisma.holiday.deleteMany({where:{id,tenantId:u.tenantId}});return NextResponse.json({ok:true})}
