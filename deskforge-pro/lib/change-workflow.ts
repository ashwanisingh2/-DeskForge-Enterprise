export const changeStatuses = ['DRAFT', 'SUBMITTED', 'CAB_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'REVIEWED', 'CLOSED'] as const;
export const approverRoles = ['CAB_CHAIR', 'TECH_APPROVER', 'BUSINESS_APPROVER'] as const;

/** Allowed change-request status transitions (CAB workflow). */
const flow: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['CAB_REVIEW', 'APPROVED'],
  CAB_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['IMPLEMENTED'],
  IMPLEMENTED: ['REVIEWED'],
  REVIEWED: ['CLOSED'],
  REJECTED: ['DRAFT'],
  CLOSED: [],
};

/** Returns the statuses a change may transition to from the given status. */
export function allowedChangeTransitions(status: string) {
  return flow[status] || [];
}

/** Throws when a change status transition is not permitted. */
export function assertChangeTransition(from: string, to: string) {
  if (from === to) return;
  if (!allowedChangeTransitions(from).includes(to)) {
    throw new Error(`INVALID_CHANGE_TRANSITION:${from}:${to}`);
  }
}

/**
 * Auto-calculates change risk from type and plan completeness.
 * Complete = implementation and rollback plans each longer than 30 chars.
 */
export function calculateRisk(type: string, implementationPlan?: string, rollbackPlan?: string) {
  const complete = (implementationPlan?.length || 0) > 30 && (rollbackPlan?.length || 0) > 30;
  if (type === 'EMERGENCY') return complete ? 'HIGH' : 'CRITICAL';
  if (type === 'NORMAL') return complete ? 'MEDIUM' : 'HIGH';
  return complete ? 'LOW' : 'MEDIUM';
}

/** True when a proposed change window overlaps any freeze period. */
export function detectFreezePeriod(start?: Date | null, end?: Date | null, freezes: {start: Date; end: Date}[] = []) {
  if (!start || !end) return false;
  return freezes.some((f) => start <= f.end && end >= f.start);
}

/** Standard changes are pre-approved; others start in SUBMITTED. */
export function initialStatusForType(type: string) {
  return type === 'STANDARD' ? 'APPROVED' : 'SUBMITTED';
}
