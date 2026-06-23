import {Queue,Worker,QueueEvents,type JobsOptions,type Processor} from 'bullmq';
import IORedis from 'ioredis';

let connection:IORedis|null=null;
export function redisConnection(){
  if(!process.env.REDIS_URL)throw new Error('REDIS_URL_REQUIRED');
  if(!connection)connection=new IORedis(process.env.REDIS_URL,{maxRetriesPerRequest:null});
  return connection;
}
export function createQueue<T=unknown>(name:string){return new Queue<T>(name,{connection:redisConnection() as any})}
export function createWorker<T=unknown>(name:string,processor:Processor<T>,concurrency=1){return new Worker<T>(name,processor,{connection:redisConnection() as any,concurrency})}
export function createQueueEvents(name:string){return new QueueEvents(name,{connection:redisConnection() as any})}
export async function scheduleRepeatable(name:string,jobName:string,every:number,data:unknown={},opts:JobsOptions={}){return createQueue(name).add(jobName,data,{...opts,repeat:{every}})}

export const queues={
  slaChecks:()=>createQueue('sla-checks'),
  autoClose:()=>createQueue('auto-close'),
  notifications:()=>createQueue('notifications'),
  emailIngestion:()=>createQueue('email-ingestion')
};
