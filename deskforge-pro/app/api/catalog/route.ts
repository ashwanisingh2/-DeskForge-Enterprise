import {Prisma} from '@prisma/client';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {sanitizeHtml} from '@/lib/sanitize';
import {structuredError} from '@/lib/api-errors';
import {demoCatalogItems,isLocalDemo} from '@/lib/demo-data';

const schema=z.object({name:z.string().min(3),description:z.string().min(10).transform(sanitizeHtml),category:z.string().min(2),formSchema:z.record(z.string(),z.unknown()),approvalSchema:z.record(z.string(),z.unknown()).nullable().optional(),fulfillmentTeam:z.string().optional(),deliveryHours:z.number().int().positive().optional(),cost:z.number().nonnegative().nullable().optional()});
export async function GET(){try{if(isLocalDemo())return NextResponse.json({items:demoCatalogItems,total:demoCatalogItems.length});let u=await requireUser(),items=await prisma.serviceCatalogItem.findMany({where:{tenantId:u.tenantId,isActive:true},orderBy:[{category:'asc'},{name:'asc'}]});return NextResponse.json({items,total:items.length})}catch(e:any){return NextResponse.json(structuredError(e),{status:e?.message==='FORBIDDEN'?403:401})}}
export async function POST(req:NextRequest){try{let u=await requireUser('catalog:manage'),data=schema.parse(await req.json()),item=await prisma.serviceCatalogItem.create({data:{...data,formSchema:data.formSchema as Prisma.InputJsonObject,approvalSchema:data.approvalSchema as Prisma.InputJsonObject|undefined,tenantId:u.tenantId}});await prisma.auditLog.create({data:{tenantId:u.tenantId,userId:u.id,action:'CREATE',entityType:'CatalogItem',entityId:item.id,newValue:{name:item.name,category:item.category}}});return NextResponse.json(item,{status:201})}catch(e){let m=e instanceof Error?e.message:'INVALID_REQUEST';return NextResponse.json(structuredError(e),{status:m==='FORBIDDEN'?403:400})}}
