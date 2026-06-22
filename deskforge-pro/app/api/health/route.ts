import {NextResponse} from 'next/server';import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export async function GET(){let started=Date.now(),database='ok';try{await prisma.$queryRaw`SELECT 1`}catch{database='error'}let ok=database==='ok';return NextResponse.json({status:ok?'healthy':'degraded',service:'deskforge-pro',version:process.env.npm_package_version||'1.0.0',checks:{database},latencyMs:Date.now()-started,timestamp:new Date().toISOString()},{status:ok?200:503})}
