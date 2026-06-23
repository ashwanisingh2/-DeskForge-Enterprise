import {redirect} from 'next/navigation';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {Dashboard} from '@/components/Dashboard';
import {demoDashboard,isLocalDemo} from '@/lib/demo-data';

export default async function Page(){
  let s=await getServerSession(authOptions);
  if(!s)redirect('/login');
  let tenantId=(s.user as any).tenantId;
  if(!tenantId)redirect('/login');
  if(isLocalDemo())return <Shell><Dashboard data={demoDashboard}/></Shell>;
  let t=await prisma.ticket.findMany({where:{deletedAt:null,tenantId}}),today=new Date().toDateString(),resolved=t.filter(x=>x.status==='RESOLVED'),hours=resolved.filter(x=>x.resolvedAt).map(x=>(x.resolvedAt!.getTime()-x.createdAt.getTime())/36e5),statuses=['OPEN','IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD','RESOLVED','CLOSED'],data={totalTickets:t.length,openTickets:t.filter(x=>x.status==='OPEN').length,resolvedToday:resolved.filter(x=>x.updatedAt.toDateString()===today).length,overdueTickets:t.filter(x=>x.dueDate&&x.dueDate<new Date()&&!['RESOLVED','CLOSED'].includes(x.status)).length,avgResolutionTime:+(hours.reduce((a,b)=>a+b,0)/(hours.length||1)).toFixed(1),slaCompliance:Math.round(t.filter(x=>x.slaStatus!=='BREACHED').length/(t.length||1)*100),ticketsByStatus:statuses.map(status=>({status,count:t.filter(x=>x.status===status).length})),trendLast14Days:[...Array(14)].map((_,i)=>{let d=new Date(Date.now()-(13-i)*864e5),k=d.toDateString();return{day:d.toLocaleDateString('en',{weekday:'short'}),created:t.filter(x=>x.createdAt.toDateString()===k).length,resolved:t.filter(x=>x.resolvedAt?.toDateString()===k).length}})};
  return <Shell><Dashboard data={data}/></Shell>;
}
