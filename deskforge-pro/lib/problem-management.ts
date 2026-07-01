export const problemStatuses = ['INVESTIGATING', 'IDENTIFIED', 'MITIGATED', 'CLOSED'] as const;
export type ProblemStatus = (typeof problemStatuses)[number];

/** Allowed problem status transitions (ITIL problem lifecycle). */
const transitions: Record<ProblemStatus, ProblemStatus[]> = {
  INVESTIGATING: ['IDENTIFIED'],
  IDENTIFIED: ['MITIGATED', 'CLOSED'],
  MITIGATED: ['CLOSED', 'IDENTIFIED'],
  CLOSED: [],
};

/** Returns the statuses a problem may transition to from the given status. */
export function allowedProblemTransitions(status: string) {
  return transitions[status as ProblemStatus] || [];
}

/** Throws when a problem status transition is not permitted. */
export function assertProblemTransition(from: string, to: string) {
  if (from === to) return;
  if (!allowedProblemTransitions(from).includes(to as ProblemStatus)) {
    throw new Error(`INVALID_PROBLEM_TRANSITION:${from}:${to}`);
  }
}

/** Suggest opening a problem record once an incident cluster reaches 5+ tickets. */
export function shouldSuggestProblem(count: number) {
  return count >= 5;
}

/** Normalises a 5-Whys input into an array of at most 5 strings. */
export function normalizeFiveWhys(input: unknown) {
  return Array.isArray(input) ? input.slice(0, 5).map(String) : [];
}
