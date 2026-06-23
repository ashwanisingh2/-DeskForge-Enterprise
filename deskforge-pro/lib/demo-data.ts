export const isLocalDemo=()=>process.env.LOCAL_DEMO_NO_DB==='true';

export const demoUser={id:'local-demo-admin',name:'Ashwani Sharma',email:'admin@deskforge.local',role:'ADMIN',tenantId:'local-demo-tenant'};

export const demoTickets=[
  {id:'TKT-0001',title:'Laptop will not connect to office WiFi',description:'Requester cannot connect to Conference Room B WiFi.',status:'OPEN',priority:'HIGH',category:'Network',requester:{name:'Rahul Gupta'},assignee:{name:'Priya Mehta'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),dueDate:new Date(Date.now()+8*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]},
  {id:'TKT-0002',title:'Outlook not syncing on iPhone',description:'Mail app is not receiving latest Office 365 messages.',status:'IN_PROGRESS',priority:'MEDIUM',category:'Email',requester:{name:'Sneha Verma'},assignee:{name:'Ravi Kumar'},createdAt:new Date(Date.now()-864e5).toISOString(),updatedAt:new Date().toISOString(),dueDate:new Date(Date.now()+24*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]},
  {id:'TKT-0003',title:'Printer offline near accounts',description:'Network printer on third floor shows offline for all users.',status:'RESOLVED',priority:'LOW',category:'Printer',requester:{name:'Rahul Gupta'},assignee:{name:'Priya Mehta'},createdAt:new Date(Date.now()-2*864e5).toISOString(),updatedAt:new Date().toISOString(),resolvedAt:new Date().toISOString(),dueDate:new Date(Date.now()+72*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]}
];

export const demoDashboard={totalTickets:25,openTickets:7,resolvedToday:3,overdueTickets:2,avgResolutionTime:5.6,slaCompliance:92,ticketsByStatus:['OPEN','IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD','RESOLVED','CLOSED'].map((status,i)=>({status,count:[7,5,3,2,5,3][i]})),trendLast14Days:[...Array(14)].map((_,i)=>({day:new Date(Date.now()-(13-i)*864e5).toLocaleDateString('en',{weekday:'short'}),created:[1,3,2,4,1,0,2,5,3,2,4,1,3,2][i],resolved:[0,1,2,1,3,1,2,2,4,1,2,3,2,3][i]}))};

export const demoKb=[['Password reset guide','Access','Use self-service reset first, then contact the service desk if MFA blocks recovery.'],['VPN troubleshooting','Network','Confirm internet access, restart the VPN client, and retry with company credentials.'],['Printer setup','Hardware','Install the network printer profile and verify paper tray assignment.']];
export const demoAssets=[['AST-1001','Dell Latitude 7440','Laptop','Rahul Gupta','OPERATIONAL','DL-7440-001'],['AST-1002','HP LaserJet M404','Printer','Accounts','MAINTENANCE','HP-M404-201']];
export const demoChanges=[['CHG-0001','Firewall rule update','NORMAL','MEDIUM','PENDING'],['CHG-0002','Office 365 license cleanup','STANDARD','LOW','APPROVED']];
export const demoProblems=[['PRB-0001','Recurring VPN drops','INVESTIGATING','Ravi Kumar',4,true],['PRB-0002','Printer queue failures','KNOWN_ERROR','Priya Mehta',3,true]];
