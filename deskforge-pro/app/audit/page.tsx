import {Shell} from '@/components/Shell';

const rows=[['LOGIN','User','admin','Successful demo sign-in'],['CREATE','Ticket','TKT-0001','Ticket created'],['UPDATE','Ticket','TKT-0002','Status changed']];
export default function Page(){return <Shell><h1 className="text-3xl font-bold">Audit Log</h1><p className="mb-6 text-slate-500">Security and data-change events.</p><div className="card overflow-x-auto p-0"><table className="table"><thead><tr><th>Action</th><th>Entity</th><th>ID</th><th>Detail</th></tr></thead><tbody>{rows.map(r=><tr key={r.join('-')}><td>{r[0]}</td><td>{r[1]}</td><td className="font-mono text-blue-700">{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div></Shell>}
