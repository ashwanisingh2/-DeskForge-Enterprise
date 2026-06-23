import {NextRequest,NextResponse} from 'next/server';
import {runSlaCheck} from '@/lib/queues/processors';
export async function POST(req:NextRequest){if(process.env.CRON_SECRET&&req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'UNAUTHORIZED'},{status:401});return NextResponse.json(await runSlaCheck())}
