export const changeStatuses=['DRAFT','SUBMITTED','CAB_REVIEW','APPROVED','REJECTED','IMPLEMENTED','REVIEWED','CLOSED'] as const;
export const approverRoles=['CAB_CHAIR','TECH_APPROVER','BUSINESS_APPROVER'] as const;
const flow:Record<string,string[]>={DRAFT:['SUBMITTED'],SUBMITTED:['CAB_REVIEW','APPROVED'],CAB_REVIEW:['APPROVED','REJECTED'],APPROVED:['IMPLEMENTED'],IMPLEMENTED:['REVIEWED'],REVIEWED:['CLOSED'],REJECTED:['DRAFT'],CLOSED:[]};
export function allowedChangeTransitions(status:string){return flow[status]||[]}
export function assertChangeTransition(from:string,to:string){if(from===to)return;if(!allowedChangeTransitions(from).includes(to))throw new Error(`INVALID_CHANGE_TRANSITION:${from}:${to}`)}
export function calculateRisk(type:string,implementationPlan?:string,rollbackPlan?:string){let complete=(implementationPlan?.length||0)>30&&(rollbackPlan?.length||0)>30;if(type==='EMERGENCY')return complete?'HIGH':'CRITICAL';if(type==='NORMAL')return complete?'MEDIUM':'HIGH';return complete?'LOW':'MEDIUM'}
export function detectFreezePeriod(start?:Date|null,end?:Date|null,freezes:{start:Date;end:Date}[]=[]){if(!start||!end)return false;return freezes.some(f=>start<=f.end&&end>=f.start)}
export function initialStatusForType(type:string){return type==='STANDARD'?'APPROVED':'SUBMITTED'}
