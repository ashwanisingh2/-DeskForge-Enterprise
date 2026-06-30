export const STATUS_OPTIONS = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING',
  'PENDING_CUSTOMER',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
] as const;

export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CATEGORY_OPTIONS = ['Hardware', 'Software', 'Network', 'Access & Permissions', 'Email', 'Printer'] as const;

export const SLA_OPTIONS = ['ON_TRACK', 'AT_RISK', 'WARNING', 'CRITICAL', 'BREACHED'] as const;

export const SORT_OPTIONS = [
  {value: 'createdAt', label: 'Created'},
  {value: 'updatedAt', label: 'Updated'},
  {value: 'priority', label: 'Priority'},
  {value: 'status', label: 'Status'},
  {value: 'dueDate', label: 'Due date'},
  {value: 'title', label: 'Title'},
] as const;

export type TicketFilterState = {
  search: string;
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  slaStatus: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const DEFAULT_FILTERS: TicketFilterState = {
  search: '',
  status: '',
  priority: '',
  category: '',
  assigneeId: '',
  slaStatus: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const humanize = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
