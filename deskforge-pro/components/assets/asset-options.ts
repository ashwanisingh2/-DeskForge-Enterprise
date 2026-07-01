export const ASSET_TYPES = ['Laptop', 'Desktop', 'Monitor', 'Server', 'Printer', 'Switch', 'Router', 'Firewall', 'Mobile', 'Software', 'License'] as const;

export const ASSET_STATUSES = ['OPERATIONAL', 'MAINTENANCE', 'RETIRED', 'MISSING'] as const;

export const CI_RELATIONSHIP_TYPES = ['DEPENDS_ON', 'CONNECTS_TO', 'RUNS_ON', 'HOSTED_ON', 'PART_OF', 'BACKS_UP'] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const assetStatusTone: Record<AssetStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  OPERATIONAL: 'success',
  MAINTENANCE: 'warning',
  RETIRED: 'neutral',
  MISSING: 'danger',
};

export const humanizeRelation = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
