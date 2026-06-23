import type {ParsedMail} from 'mailparser';
import {sanitizeHtml} from '../sanitize';

export function parseEmail(mail:ParsedMail){
  let from=mail.from?.value?.[0]?.address?.toLowerCase()||'',subject=mail.subject||'(no subject)',body=sanitizeHtml(mail.html?String(mail.html):`<p>${mail.textAsHtml||mail.text||''}</p>`),references=[...(Array.isArray(mail.references)?mail.references:mail.references?[mail.references]:[]),mail.inReplyTo].filter(Boolean) as string[];
  return{from,subject,body,attachments:mail.attachments||[],references,messageId:mail.messageId};
}

export function ticketIdFromReferences(subject:string,references:string[]){
  let haystack=[subject,...references].join(' ');
  return haystack.match(/TKT-\d{4,}/)?.[0]||null;
}
