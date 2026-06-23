import {createWorker,scheduleRepeatable} from './index';
import {runAutoClose,runNotification,runSlaCheck} from './processors';
import {processUnreadEmails} from '@/lib/email/ingestion';

export function startDeskForgeWorkers(){
  let workers=[
    createWorker('sla-checks',runSlaCheck),
    createWorker('auto-close',runAutoClose),
    createWorker('notifications',runNotification,10),
    createWorker('email-ingestion',processUnreadEmails)
  ];
  scheduleRepeatable('sla-checks','sla-check',5*60*1000).catch(()=>undefined);
  scheduleRepeatable('auto-close','auto-close',60*60*1000).catch(()=>undefined);
  scheduleRepeatable('email-ingestion','email-ingestion',5*60*1000).catch(()=>undefined);
  return workers;
}
