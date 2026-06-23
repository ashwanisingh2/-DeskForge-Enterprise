import {prisma} from '@/lib/prisma';
import {calculateDueDate} from '@/lib/sla';
import {allowedAttachmentTypes,attachmentKey,maxAttachmentBytes,uploadAttachmentObject} from '@/lib/storage';
import {fetchUnreadEmails,markAsRead} from './imap-client';
import {parseEmail,ticketIdFromReferences} from './email-parser';

export async function processUnreadEmails(){
  let processed=0,created=0,commented=0;
  for(let item of await fetchUnreadEmails()){
    let email=parseEmail(item.parsed),user=await prisma.user.findFirst({where:{email:email.from,isActive:true}});
    if(!user)continue;
    let existingId=ticketIdFromReferences(email.subject,email.references);
    const saveAttachments=async (ticketId:string)=>{
      for(let a of email.attachments){
        let contentType=a.contentType||'application/octet-stream',filename=a.filename||'attachment';
        if(!allowedAttachmentTypes.has(contentType)||!a.content||a.size>maxAttachmentBytes)continue;
        try{let key=attachmentKey(user.tenantId,ticketId,filename);await uploadAttachmentObject(key,a.content,contentType);await prisma.attachment.create({data:{ticketId,filename,url:key,objectKey:key,contentType,size:a.size||a.content.length,uploadedBy:user.id}})}catch{}
      }
    };
    if(existingId){
      let ticket=await prisma.ticket.findFirst({where:{id:existingId,tenantId:user.tenantId,deletedAt:null}});
      if(ticket){await prisma.comment.create({data:{ticketId:ticket.id,authorId:user.id,content:email.body,isInternal:false}});await saveAttachments(ticket.id);commented++;await markAsRead(item.seqno);continue}
    }
    let last=await prisma.ticket.findFirst({orderBy:{createdAt:'desc'},select:{id:true}}),id=`TKT-${String((+(last?.id.split('-')[1]||0))+1).padStart(4,'0')}`;
    await prisma.ticket.create({data:{id,tenantId:user.tenantId,requesterId:user.id,title:email.subject,description:email.body,priority:'MEDIUM',category:'Email',source:'EMAIL',dueDate:calculateDueDate('MEDIUM'),activityLogs:{create:{userId:user.id,action:'email_created',detail:email.messageId||'Email ingested'}}}});
    await saveAttachments(id);
    created++;processed++;await markAsRead(item.seqno);
  }
  return{processed,created,commented};
}
