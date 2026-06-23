import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/session';
import {commentSchema} from '@/lib/validations';
import {sendNewCommentEmail} from '@/lib/email';
import {structuredError} from '@/lib/api-errors';

export async function POST(req:NextRequest,ctx:{params:Promise<{id:string}>}){
  let {id}=await ctx.params;
  try{
    let u=await requireUser('comment:create'),d=commentSchema.parse(await req.json());
    let ticket=await prisma.ticket.findFirst({where:{id:id,tenantId:u.tenantId,deletedAt:null}});
    if(!ticket)return NextResponse.json({error:{code:'NOT_FOUND',message:'Not found'}},{status:404});
    if(d.isInternal&&u.role==='END_USER')return NextResponse.json({error:{code:'FORBIDDEN',message:'Forbidden'}},{status:403});
    let c=await prisma.comment.create({data:{...d,ticketId:id,authorId:u.id},include:{author:true,ticket:{include:{requester:true}}}});
    await prisma.activityLog.create({data:{ticketId:id,userId:u.id,action:d.isInternal?'internal_note':'comment',detail:'Comment added'}});
    if(!d.isInternal)await sendNewCommentEmail(c.ticket,c,c.ticket.requester);
    return NextResponse.json(c,{status:201});
  }catch(e){
    return NextResponse.json(structuredError(e),{status:400});
  }
}
