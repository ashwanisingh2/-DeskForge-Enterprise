import {demoChangeRecords} from './demo-data';

/**
 * In-memory demo store for change requests, shared across the change API routes
 * (approve / implement / review / [id]). Persists for the dev-server lifetime.
 */
export const demoChangeStore = new Map<string, any>(
  demoChangeRecords.map((c) => [c.id, {...c, approvals: c.approvals.map((a) => ({...a}))}]),
);
