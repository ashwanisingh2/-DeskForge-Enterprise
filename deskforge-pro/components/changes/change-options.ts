export const CHANGE_TYPES = ['STANDARD', 'NORMAL', 'EMERGENCY'] as const;
export const CHANGE_RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const CHANGE_STATUSES = ['DRAFT', 'SUBMITTED', 'CAB_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'REVIEWED', 'CLOSED'] as const;
export const APPROVER_ROLES = ['CAB_CHAIR', 'TECH_APPROVER', 'BUSINESS_APPROVER'] as const;

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple';

export const changeStatusTone: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  CAB_REVIEW: 'purple',
  APPROVED: 'success',
  REJECTED: 'danger',
  IMPLEMENTED: 'info',
  REVIEWED: 'warning',
  CLOSED: 'neutral',
};

export const riskTone: Record<string, Tone> = {LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger'};

export const humanize = (v: string) => v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
