import Imap from 'imap';
import {simpleParser} from 'mailparser';

export function connect(){
  for(let key of ['IMAP_HOST','IMAP_USER','IMAP_PASSWORD'])if(!process.env[key])throw new Error(`${key}_REQUIRED`);
  return new Imap({user:process.env.IMAP_USER!,password:process.env.IMAP_PASSWORD!,host:process.env.IMAP_HOST!,port:Number(process.env.IMAP_PORT||993),tls:true});
}

export async function fetchUnreadEmails(){
  let imap=connect();
  return new Promise<any[]>((resolve,reject)=>{
    let messages:any[]=[];
    imap.once('ready',()=>imap.openBox('INBOX',false,err=>{
      if(err)return reject(err);
      imap.search(['UNSEEN'],(err,results)=>{
        if(err)return reject(err);
        if(!results.length){imap.end();return resolve([])}
        let fetch=imap.fetch(results,{bodies:'',markSeen:false});
        fetch.on('message',(msg,seqno)=>msg.on('body',stream=>simpleParser(stream as any).then(parsed=>messages.push({seqno,parsed})).catch(reject)));
        fetch.once('error',reject);
        fetch.once('end',()=>{imap.end();resolve(messages)});
      });
    }));
    imap.once('error',reject);
    imap.connect();
  });
}

export async function markAsRead(seqno:number){
  let imap=connect();
  return new Promise<void>((resolve,reject)=>{
    imap.once('ready',()=>imap.openBox('INBOX',false,err=>{if(err)return reject(err);imap.addFlags(seqno,'\\Seen',err=>{imap.end();err?reject(err):resolve()})}));
    imap.once('error',reject);
    imap.connect();
  });
}
