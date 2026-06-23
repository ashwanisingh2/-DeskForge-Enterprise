import type {Priority,Ticket} from '@prisma/client';
const rules={CRITICAL:{responseHrs:1,resolutionHrs:4},HIGH:{responseHrs:4,resolutionHrs:8},MEDIUM:{responseHrs:8,resolutionHrs:24},LOW:{responseHrs:24,resolutionHrs:72}} as const;
export type BusinessWindow={dayOfWeek:number;startHour:number;endHour:number};
export type Holiday={date:Date|string;description?:string};
export function getSLAConfig(p:Priority){return rules[p]}
export function defaultBusinessHours():BusinessWindow[]{return[1,2,3,4,5].map(dayOfWeek=>({dayOfWeek,startHour:9,endHour:18}))}
function dateKey(d:Date){return d.toISOString().slice(0,10)}
function isBusinessMinute(d:Date,hours:BusinessWindow[],holidays:Holiday[]=[]){if(holidays.some(h=>dateKey(new Date(h.date))===dateKey(d)))return false;let w=hours.find(x=>x.dayOfWeek===d.getDay());return !!w&&d.getHours()>=w.startHour&&d.getHours()<w.endHour}
export function addBusinessHours(start:Date,hoursToAdd:number,hours=defaultBusinessHours(),holidays:Holiday[]=[]){let d=new Date(start),remaining=Math.ceil(hoursToAdd*60);while(remaining>0){d=new Date(d.getTime()+60000);if(isBusinessMinute(d,hours,holidays))remaining--}return d}
export function businessMinutesBetween(start:Date,end:Date,hours=defaultBusinessHours(),holidays:Holiday[]=[]){let d=new Date(start),minutes=0;while(d<end){if(isBusinessMinute(d,hours,holidays))minutes++;d=new Date(d.getTime()+60000)}return minutes}
export function calculateDueDate(p:Priority,createdAt=new Date(),hours=defaultBusinessHours(),holidays:Holiday[]=[]){return addBusinessHours(createdAt,rules[p].resolutionHrs,hours,holidays)}
export function getBusinessTimeRemaining(dueDate:Date,now=new Date(),hours=defaultBusinessHours(),holidays:Holiday[]=[]){let isBreached=dueDate<=now,minutes=isBreached?businessMinutesBetween(dueDate,now,hours,holidays):businessMinutesBetween(now,dueDate,hours,holidays);return{hours:Math.floor(minutes/60),minutes:minutes%60,isBreached}}
export function getSLAStatus(t:Pick<Ticket,'dueDate'|'status'|'createdAt'>,now=new Date()){if(!t.dueDate||['RESOLVED','CLOSED','PENDING_CUSTOMER','ON_HOLD'].includes(t.status))return'ON_TRACK';let total=t.dueDate.getTime()-t.createdAt.getTime(),left=t.dueDate.getTime()-now.getTime(),ratio=left/Math.max(total,1);return left<=0?'BREACHED':ratio<=.1?'CRITICAL':ratio<=.25?'WARNING':'ON_TRACK'}
export function getTimeRemaining(d:Date){let n=d.getTime()-Date.now(),a=Math.abs(n);return{hours:Math.floor(a/3600000),minutes:Math.floor(a%3600000/60000),isBreached:n<0}}
