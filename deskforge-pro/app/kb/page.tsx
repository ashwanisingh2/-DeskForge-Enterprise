import {Shell} from '@/components/Shell';
import {demoKb} from '@/lib/demo-data';

export default function Page(){
  return <Shell><h1 className="text-3xl font-bold">Knowledge Base</h1><p className="mb-6 text-slate-500">Reusable support articles and fixes.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{demoKb.map(([title,category,content])=><article className="card" key={title}><span className="badge bg-blue-100 text-blue-800">{category}</span><h2 className="my-3 text-xl font-bold">{title}</h2><p className="text-slate-500">{content}</p></article>)}</div></Shell>
}
