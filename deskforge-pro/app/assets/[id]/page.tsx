import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {Shell} from '@/components/Shell';
import {AssetDetail} from '@/components/assets/AssetDetail';
import {requireUser} from '@/lib/session';
import {demoAssetRecords, isLocalDemo} from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

const ciSelect = {select: {id: true, assetTag: true, name: true, type: true, status: true}};

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;

  if (isLocalDemo()) {
    const demo = demoAssetRecords.find((a) => a.id === id);
    if (!demo) notFound();
    return <Shell><AssetDetail initial={demo as never} /></Shell>;
  }

  const u = await requireUser('asset:read');
  const asset = await prisma.asset.findFirst({
    where: {id, tenantId: u.tenantId},
    include: {owner: {select: {id: true, name: true}}, relationships: {include: {target: ciSelect}}, relatedFrom: {include: {source: ciSelect}}},
  });
  if (!asset) notFound();

  const serialized = {
    ...asset,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
  };

  return (
    <Shell>
      <AssetDetail initial={serialized as never} />
    </Shell>
  );
}
