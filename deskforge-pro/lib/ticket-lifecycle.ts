import type {TicketStatus} from '@prisma/client';
import type {SessionUser} from './session';

const transitions:Record<TicketStatus,TicketStatus[]>={
  OPEN:['IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD'],
  ASSIGNED:['IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD'],
  IN_PROGRESS:['PENDING_CUSTOMER','ON_HOLD','RESOLVED'],
  PENDING:['IN_PROGRESS','CLOSED'],
  PENDING_CUSTOMER:['IN_PROGRESS','CLOSED'],
  ON_HOLD:['IN_PROGRESS','OPEN'],
  RESOLVED:['CLOSED','OPEN'],
  CLOSED:['OPEN']
};

export function allowedTransitions(from:TicketStatus){return transitions[from]||[]}

export function canTransition(user:SessionUser,ticket:any,to:TicketStatus,now=new Date()){
  if(user.role==='ADMIN')return true;
  if(['IN_PROGRESS','RESOLVED'].includes(to))return user.role==='AGENT'&&ticket.assigneeId===user.id;
  if(ticket.status==='RESOLVED'&&to==='CLOSED')return ticket.requesterId===user.id;
  if(ticket.status==='RESOLVED'&&to==='OPEN'&&ticket.resolvedAt)return now.getTime()-new Date(ticket.resolvedAt).getTime()<=30*864e5;
  if(ticket.status==='CLOSED'&&to==='OPEN')return true;
  return user.role==='AGENT';
}

export function assertTransition(from:TicketStatus,to:TicketStatus,user?:SessionUser,ticket?:any){
  if(from===to)return;
  let allowed=allowedTransitions(from);
  if(!allowed.includes(to)){let e=new Error(`INVALID_TRANSITION:${from}:${to}`) as Error&{allowed?:TicketStatus[]};e.allowed=allowed;throw e}
  if(user&&ticket&&!canTransition(user,ticket,to)){let e=new Error('TRANSITION_FORBIDDEN') as Error&{allowed?:TicketStatus[]};e.allowed=allowed;throw e}
}

export function lifecycleDates(status:TicketStatus){return{...(status==='RESOLVED'?{resolvedAt:new Date(),closedAt:null}:{}),...(status==='CLOSED'?{closedAt:new Date()}:{}),...(['OPEN','IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD'].includes(status)?{resolvedAt:null,closedAt:null}:{})}}
