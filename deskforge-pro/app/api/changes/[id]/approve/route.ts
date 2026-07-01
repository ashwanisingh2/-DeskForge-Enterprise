import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {sanitizeHtml} from '@/lib/sanitize';
import {structuredError} from '@/lib/api-errors';
import {isLocalDemo} from '@/lib/demo-data';
import {demoChangeStore} from '@/lib/demo-store';

const decisionSchema=z.object({
  decision:z.enum(['APPROVED','REJECTED']).default('APPROVED'),
  comment:z.string().max(2000).optional().transform(v=>v?sanitizeHtml(v):v)
});

export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  try{
    let {id}=await ctx.params;
    const {decision,comment}=decisionSchema.parse(await req.json().catch(()=>({})));
    if(isLocalDemo()){
      const change=demoChangeStore.get(id);
      if(!change)return NextResponse.json({error:{code:'NOT_FOUND',message:'Not found'}},{status:404});
      const approvals=change.approvals.map((a:any)=>a.status==='PENDING'?{...a,status:decision,comment,decidedAt:new Date().toISOString()}:a);
      const status=decision==='REJECTED'?'REJECTED':approvals.every((a:any)=>a.status==='APPROVED')?'APPROVED':change.status;
      const updated={...change,approvals,status};
      demoChangeStore.set(id,updated);
      return NextResponse.json(updated);
    }
    let u=await requireUser('change:manage');
    let change=await prisma.changeRequest.findFirst({where:{id,tenantId:u.tenantId}});
    if(!change)return NextResponse.json({error:{code:'NOT_FOUND',message:'Change request not found'}},{status:404});
    let recorded=await prisma.approval.updateMany({where:{changeId:id,approverId:u.id,status:'PENDING'},data:{status:decision,comment,decidedAt:new Date()}});
    if(recorded.count===0)return NextResponse.json({error:{code:'NOT_AN_APPROVER',message:'You have no pending approval for this change'}},{status:403});
    let approvals=await prisma.approval.findMany({where:{changeId:id}});
    let status=decision==='REJECTED'?'REJECTED':approvals.every(a=>a.status==='APPROVED')?'APPROVED':change.status;
    let updated=await prisma.changeRequest.update({where:{id},data:{status}});
    return NextResponse.json(updated);
  }catch(e:any){
    return NextResponse.json(structuredError(e),{status:e?.message==='UNAUTHORIZED'?401:e?.message==='FORBIDDEN'?403:400});
  }
}
