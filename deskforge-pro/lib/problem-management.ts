export const problemStatuses=['INVESTIGATING','IDENTIFIED','MITIGATED','CLOSED'] as const;
export type ProblemStatus=typeof problemStatuses[number];
const transitions:Record<ProblemStatus,ProblemStatus[]>={INVESTIGATING:['IDENTIFIED'],IDENTIFIED:['MITIGATED','CLOSED'],MITIGATED:['CLOSED','IDENTIFIED'],CLOSED:[]};
export function allowedProblemTransitions(status:string){return transitions[status as ProblemStatus]||[]}
export function assertProblemTransition(from:string,to:string){if(from===to)return;if(!allowedProblemTransitions(from).includes(to as ProblemStatus))throw new Error(`INVALID_PROBLEM_TRANSITION:${from}:${to}`)}
export function shouldSuggestProblem(count:number){return count>=5}
export function normalizeFiveWhys(input:unknown){return Array.isArray(input)?input.slice(0,5).map(String):[]}
