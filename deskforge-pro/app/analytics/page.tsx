import {Shell} from '@/components/Shell';
import {Dashboard} from '@/components/Dashboard';
import {demoDashboard} from '@/lib/demo-data';

export default function Page(){return <Shell><h1 className="mb-6 text-3xl font-bold">Analytics</h1><Dashboard data={demoDashboard}/></Shell>}
