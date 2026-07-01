import {notFound, redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {AssetEditor} from '@/components/assets/AssetEditor';
import {requireUser} from '@/lib/session';
import {can} from '@/lib/rbac';
import {demoAssetRecords, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoAssetRecords.find((a) => a.id === id);
    if (!demo) notFound();
    return <Shell><AssetEditor initial={demo as never} /></Shell>;
  }

  const u = await requireUser('asset:read');
  if (!can(u.role, 'asset:admin')) redirect(`/assets/${id}`);
  const asset = await prisma.asset.findFirst({where: {id, tenantId: u.tenantId}});
  if (!asset) notFound();

  const serialized = {
    ...asset,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
  };

  return (
    <Shell>
      <AssetEditor initial={serialized as never} />
    </Shell>
  );
}
