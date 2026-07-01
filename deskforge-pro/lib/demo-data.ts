export const isLocalDemo=()=>process.env.LOCAL_DEMO_NO_DB==='true';

export const demoUser={id:'local-demo-admin',name:'Ashwani Sharma',email:'admin@deskforge.local',role:'ADMIN',tenantId:'local-demo-tenant'};

export const demoTickets=[
  {id:'TKT-0001',title:'Laptop will not connect to office WiFi',description:'Requester cannot connect to Conference Room B WiFi.',status:'OPEN',priority:'HIGH',category:'Network',requester:{name:'Rahul Gupta'},assignee:{name:'Priya Mehta'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),dueDate:new Date(Date.now()+8*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]},
  {id:'TKT-0002',title:'Outlook not syncing on iPhone',description:'Mail app is not receiving latest Office 365 messages.',status:'IN_PROGRESS',priority:'MEDIUM',category:'Email',requester:{name:'Sneha Verma'},assignee:{name:'Ravi Kumar'},createdAt:new Date(Date.now()-864e5).toISOString(),updatedAt:new Date().toISOString(),dueDate:new Date(Date.now()+24*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]},
  {id:'TKT-0003',title:'Printer offline near accounts',description:'Network printer on third floor shows offline for all users.',status:'RESOLVED',priority:'LOW',category:'Printer',requester:{name:'Rahul Gupta'},assignee:{name:'Priya Mehta'},createdAt:new Date(Date.now()-2*864e5).toISOString(),updatedAt:new Date().toISOString(),resolvedAt:new Date().toISOString(),dueDate:new Date(Date.now()+72*36e5).toISOString(),slaStatus:'ON_TRACK',comments:[],activityLogs:[]}
];

export const demoDashboard={totalTickets:25,openTickets:7,inProgressTickets:5,resolvedToday:3,overdueTickets:2,criticalOpen:1,slaBreached:2,avgResolutionTime:5.6,slaCompliance:92,ticketsByStatus:['OPEN','IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD','RESOLVED','CLOSED'].map((status,i)=>({status,count:[7,5,3,2,5,3][i]})),ticketsByPriority:['LOW','MEDIUM','HIGH','CRITICAL'].map((priority,i)=>({priority,count:[6,11,6,2][i]})),recentTickets:[{id:'TKT-0003',title:'Printer offline near accounts',status:'RESOLVED',priority:'LOW',createdAt:new Date(Date.now()-2*864e5).toISOString(),requester:'Rahul Gupta'},{id:'TKT-0002',title:'Outlook not syncing on iPhone',status:'IN_PROGRESS',priority:'MEDIUM',createdAt:new Date(Date.now()-864e5).toISOString(),requester:'Sneha Verma'},{id:'TKT-0001',title:'Laptop will not connect to office WiFi',status:'OPEN',priority:'HIGH',createdAt:new Date().toISOString(),requester:'Rahul Gupta'}],trendLast14Days:[...Array(14)].map((_,i)=>({day:new Date(Date.now()-(13-i)*864e5).toLocaleDateString('en',{weekday:'short'}),created:[1,3,2,4,1,0,2,5,3,2,4,1,3,2][i],resolved:[0,1,2,1,3,1,2,2,4,1,2,3,2,3][i]}))};

export const demoKb=[['Password reset guide','Access','Use self-service reset first, then contact the service desk if MFA blocks recovery.'],['VPN troubleshooting','Network','Confirm internet access, restart the VPN client, and retry with company credentials.'],['Printer setup','Hardware','Install the network printer profile and verify paper tray assignment.']];

export const demoKbArticles=[
  {id:'KB-0001',title:'Password reset guide',category:'Access',status:'published',tags:['password','mfa'],views:142,helpfulYes:38,helpfulNo:3,content:'Use the self-service reset portal first.\n\n1. Open https://reset.example.com\n2. Verify your identity with MFA.\n3. Set a new password meeting the policy.\n\nIf MFA blocks recovery, contact the service desk.',createdAt:new Date(Date.now()-20*864e5).toISOString(),updatedAt:new Date(Date.now()-2*864e5).toISOString()},
  {id:'KB-0002',title:'VPN troubleshooting',category:'Network',status:'published',tags:['vpn','remote'],views:98,helpfulYes:25,helpfulNo:5,content:'Confirm internet access, restart the VPN client, and retry with company credentials.\n\nStill failing? Capture the client logs and raise a ticket.',createdAt:new Date(Date.now()-15*864e5).toISOString(),updatedAt:new Date(Date.now()-5*864e5).toISOString()},
  {id:'KB-0003',title:'Printer setup',category:'Hardware',status:'published',tags:['printer'],views:64,helpfulYes:14,helpfulNo:1,content:'Install the network printer profile and verify paper tray assignment.',createdAt:new Date(Date.now()-10*864e5).toISOString(),updatedAt:new Date(Date.now()-1*864e5).toISOString()},
];
export const demoAssets=[['AST-1001','Dell Latitude 7440','Laptop','Rahul Gupta','OPERATIONAL','DL-7440-001'],['AST-1002','HP LaserJet M404','Printer','Accounts','MAINTENANCE','HP-M404-201']];

export const demoAssetRecords=[
  {id:'AST-1001',assetTag:'AST-1001',name:'Dell Latitude 7440',type:'Laptop',status:'OPERATIONAL',serialNumber:'DL-7440-001',owner:{id:'demo-agent-1',name:'Rahul Gupta'},purchaseDate:new Date(Date.now()-300*864e5).toISOString(),warrantyEnd:new Date(Date.now()+400*864e5).toISOString(),metadata:null,relationships:[],relatedFrom:[],createdAt:new Date(Date.now()-300*864e5).toISOString(),updatedAt:new Date().toISOString()},
  {id:'AST-1002',assetTag:'AST-1002',name:'HP LaserJet M404',type:'Printer',status:'MAINTENANCE',serialNumber:'HP-M404-201',owner:null,purchaseDate:null,warrantyEnd:null,metadata:null,relationships:[],relatedFrom:[],createdAt:new Date(Date.now()-200*864e5).toISOString(),updatedAt:new Date().toISOString()},
];
export const demoChanges=[['CHG-0001','Firewall rule update','NORMAL','MEDIUM','PENDING'],['CHG-0002','Office 365 license cleanup','STANDARD','LOW','APPROVED']];

export const demoChangeRecords=[
  {id:'CHG-0001',title:'Firewall rule update',description:'Update perimeter firewall rules for the new VPN range.',type:'NORMAL',status:'CAB_REVIEW',risk:'MEDIUM',implementationPlan:'Apply rule set in maintenance window, validate connectivity.',rollbackPlan:'Restore previous rule snapshot from backup.',windowStart:new Date(Date.now()+2*864e5).toISOString(),windowEnd:new Date(Date.now()+2*864e5+2*36e5).toISOString(),requester:{name:'Ashwani Sharma'},approvals:[{id:'a1',approverId:'demo-agent-1',approverRole:'TECH_APPROVER',status:'APPROVED',comment:null,decidedAt:new Date().toISOString()},{id:'a2',approverId:'demo-agent-2',approverRole:'CAB_CHAIR',status:'PENDING',comment:null,decidedAt:null}],createdAt:new Date(Date.now()-3*864e5).toISOString(),updatedAt:new Date().toISOString()},
  {id:'CHG-0002',title:'Office 365 license cleanup',description:'Reclaim unused E3 licenses.',type:'STANDARD',status:'APPROVED',risk:'LOW',implementationPlan:'Run reclamation script for inactive accounts.',rollbackPlan:'Reassign licenses from audit log if needed.',windowStart:null,windowEnd:null,requester:{name:'Ashwani Sharma'},approvals:[],createdAt:new Date(Date.now()-6*864e5).toISOString(),updatedAt:new Date().toISOString()},
];

export const demoProblems=[['PRB-0001','Recurring VPN drops','INVESTIGATING','Ravi Kumar',4,true],['PRB-0002','Printer queue failures','KNOWN_ERROR','Priya Mehta',3,true]];

export const demoProblemRecords=[
  {id:'PRB-0001',title:'Recurring VPN drops',description:'Multiple users report VPN disconnects every afternoon.',status:'INVESTIGATING',rootCause:null,symptoms:'Disconnects around 2pm peak load.',contributingFactors:['Peak load','Old firmware'],workaround:'Reconnect VPN client.',fiveWhys:['Users disconnect','Tunnel drops','Gateway CPU spikes','Too many sessions','Undersized appliance'],isKnownError:false,kbArticleId:null,owner:{id:'demo-agent-2',name:'Ravi Kumar'},incidents:[{problemId:'PRB-0001',ticketId:'TKT-0001',ticket:{id:'TKT-0001',title:'Laptop will not connect to office WiFi',status:'OPEN'}}],createdAt:new Date(Date.now()-5*864e5).toISOString(),updatedAt:new Date().toISOString()},
  {id:'PRB-0002',title:'Printer queue failures',description:'Print jobs stuck in queue on third floor.',status:'IDENTIFIED',rootCause:'Faulty print spooler driver.',symptoms:'Jobs stuck, spooler crash.',contributingFactors:['Outdated driver'],workaround:'Restart spooler service.',fiveWhys:[],isKnownError:true,kbArticleId:null,owner:{id:'demo-agent-1',name:'Priya Mehta'},incidents:[],createdAt:new Date(Date.now()-8*864e5).toISOString(),updatedAt:new Date().toISOString()},
];


export const demoAuditLogs=[
  {id:'al1',action:'LOGIN',entityType:'User',entityId:'admin',user:{name:'Ashwani Sharma'},ipAddress:'127.0.0.1',createdAt:new Date().toISOString(),oldValue:null,newValue:null},
  {id:'al2',action:'CREATE',entityType:'Ticket',entityId:'TKT-0001',user:{name:'Ashwani Sharma'},ipAddress:'127.0.0.1',createdAt:new Date(Date.now()-36e5).toISOString(),oldValue:null,newValue:{title:'Laptop will not connect to office WiFi'}},
  {id:'al3',action:'UPDATE',entityType:'Ticket',entityId:'TKT-0002',user:{name:'Priya Mehta'},ipAddress:'127.0.0.1',createdAt:new Date(Date.now()-72e5).toISOString(),oldValue:{status:'OPEN'},newValue:{status:'IN_PROGRESS'}},
  {id:'al4',action:'CREATE',entityType:'Asset',entityId:'AST-1001',user:{name:'Ashwani Sharma'},ipAddress:'127.0.0.1',createdAt:new Date(Date.now()-2*864e5).toISOString(),oldValue:null,newValue:{assetTag:'AST-1001'}},
];

export const demoBusinessHours=[1,2,3,4,5].map(dayOfWeek=>({id:String(dayOfWeek),dayOfWeek,startHour:9,endHour:18}));
export const demoHolidays=[{id:'h1',date:new Date(Date.now()+10*864e5).toISOString(),description:'Company foundation day'}];


export const demoCatalogItems=[
  {id:'svc1',category:'Access',name:'New user onboarding',description:'Laptop, email, VPN and app access package for a new joiner.',deliveryHours:24,cost:null,fulfillmentTeam:'IT Onboarding',isActive:true},
  {id:'svc2',category:'Hardware',name:'Laptop replacement',description:'Request a replacement device after manager approval.',deliveryHours:48,cost:null,fulfillmentTeam:'Hardware',isActive:true},
  {id:'svc3',category:'Software',name:'Adobe Creative Cloud license',description:'Submit a software license request for design tooling.',deliveryHours:12,cost:1800,fulfillmentTeam:'Licensing',isActive:true},
];


export const demoManagedUsers=[
  {id:'local-demo-admin',name:'Ashwani Sharma',email:'admin@deskforge.local',username:'admin',role:'ADMIN',department:'IT',isActive:true,createdAt:new Date(Date.now()-100*864e5).toISOString()},
  {id:'demo-agent-1',name:'Priya Mehta',email:'priya@deskforge.local',username:'agent1',role:'AGENT',department:'IT Support',isActive:true,createdAt:new Date(Date.now()-80*864e5).toISOString()},
  {id:'demo-agent-2',name:'Ravi Kumar',email:'ravi@deskforge.local',username:'agent2',role:'AGENT',department:'Network',isActive:true,createdAt:new Date(Date.now()-60*864e5).toISOString()},
  {id:'demo-user-1',name:'Rahul Gupta',email:'rahul@deskforge.local',username:'user1',role:'END_USER',department:'Finance',isActive:true,createdAt:new Date(Date.now()-40*864e5).toISOString()},
  {id:'demo-user-2',name:'Sneha Verma',email:'sneha@deskforge.local',username:'user2',role:'END_USER',department:'Sales',isActive:false,createdAt:new Date(Date.now()-20*864e5).toISOString()},
];

export const demoSlaConfigs=[
  {id:'s1',priority:'CRITICAL',responseTimeHrs:1,resolutionTimeHrs:4},
  {id:'s2',priority:'HIGH',responseTimeHrs:4,resolutionTimeHrs:8},
  {id:'s3',priority:'MEDIUM',responseTimeHrs:8,resolutionTimeHrs:24},
  {id:'s4',priority:'LOW',responseTimeHrs:24,resolutionTimeHrs:72},
];

export const demoCannedResponses=[
  {id:'c1',title:'Ticket received',content:'We have received your ticket and will respond shortly.',category:'General'},
  {id:'c2',title:'Resolved',content:'Please confirm the issue is fixed so we can close the ticket.',category:'General'},
];


export const demoAgents=[
  {id:'local-demo-admin',name:'Ashwani Sharma',role:'ADMIN'},
  {id:'demo-agent-1',name:'Priya Mehta',role:'AGENT'},
  {id:'demo-agent-2',name:'Ravi Kumar',role:'AGENT'},
];
