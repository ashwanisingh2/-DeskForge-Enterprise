import type {Priority, Ticket} from '@prisma/client';

/** Response and resolution targets (in business hours) per priority. */
const rules = {
  CRITICAL: {responseHrs: 1, resolutionHrs: 4},
  HIGH: {responseHrs: 4, resolutionHrs: 8},
  MEDIUM: {responseHrs: 8, resolutionHrs: 24},
  LOW: {responseHrs: 24, resolutionHrs: 72},
} as const;

export type BusinessWindow = {dayOfWeek: number; startHour: number; endHour: number};
export type Holiday = {date: Date | string; description?: string};

/** Returns the response/resolution targets for a given priority. */
export function getSLAConfig(p: Priority) {
  return rules[p];
}

/** Default business hours: Monday–Friday, 09:00–18:00 (UTC). */
export function defaultBusinessHours(): BusinessWindow[] {
  return [1, 2, 3, 4, 5].map((dayOfWeek) => ({dayOfWeek, startHour: 9, endHour: 18}));
}

/** ISO date key (YYYY-MM-DD) used to match holidays. */
function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** True when the given instant falls inside a business window and is not a holiday. */
function isBusinessMinute(d: Date, hours: BusinessWindow[], holidays: Holiday[] = []) {
  if (holidays.some((h) => dateKey(new Date(h.date)) === dateKey(d))) return false;
  const window = hours.find((x) => x.dayOfWeek === d.getUTCDay());
  return !!window && d.getUTCHours() >= window.startHour && d.getUTCHours() < window.endHour;
}

/** Adds a number of business hours to a start date, skipping non-business minutes. */
export function addBusinessHours(start: Date, hoursToAdd: number, hours = defaultBusinessHours(), holidays: Holiday[] = []) {
  let d = new Date(start);
  let remaining = Math.ceil(hoursToAdd * 60);
  while (remaining > 0) {
    d = new Date(d.getTime() + 60_000);
    if (isBusinessMinute(d, hours, holidays)) remaining--;
  }
  return d;
}

/** Counts business minutes between two instants. */
export function businessMinutesBetween(start: Date, end: Date, hours = defaultBusinessHours(), holidays: Holiday[] = []) {
  let d = new Date(start);
  let minutes = 0;
  while (d < end) {
    if (isBusinessMinute(d, hours, holidays)) minutes++;
    d = new Date(d.getTime() + 60_000);
  }
  return minutes;
}

/** Computes the SLA due date from creation time using the priority's resolution target. */
export function calculateDueDate(p: Priority, createdAt = new Date(), hours = defaultBusinessHours(), holidays: Holiday[] = []) {
  return addBusinessHours(createdAt, rules[p].resolutionHrs, hours, holidays);
}

/** Business time remaining until (or past) the due date, plus a breach flag. */
export function getBusinessTimeRemaining(dueDate: Date, now = new Date(), hours = defaultBusinessHours(), holidays: Holiday[] = []) {
  const isBreached = dueDate <= now;
  const minutes = isBreached
    ? businessMinutesBetween(dueDate, now, hours, holidays)
    : businessMinutesBetween(now, dueDate, hours, holidays);
  return {hours: Math.floor(minutes / 60), minutes: minutes % 60, isBreached};
}

/**
 * Derives the live SLA status from the due date and current status.
 * Terminal and paused statuses are always ON_TRACK.
 */
export function getSLAStatus(t: Pick<Ticket, 'dueDate' | 'status' | 'createdAt'>, now = new Date()) {
  if (!t.dueDate || ['RESOLVED', 'CLOSED', 'PENDING_CUSTOMER', 'ON_HOLD'].includes(t.status)) return 'ON_TRACK';
  const total = t.dueDate.getTime() - t.createdAt.getTime();
  const left = t.dueDate.getTime() - now.getTime();
  const ratio = left / Math.max(total, 1);
  if (left <= 0) return 'BREACHED';
  if (ratio <= 0.1) return 'CRITICAL';
  if (ratio <= 0.25) return 'WARNING';
  return 'ON_TRACK';
}

/** Absolute wall-clock time remaining until a date, with a breach flag. */
export function getTimeRemaining(d: Date) {
  const n = d.getTime() - Date.now();
  const a = Math.abs(n);
  return {hours: Math.floor(a / 3_600_000), minutes: Math.floor((a % 3_600_000) / 60_000), isBreached: n < 0};
}
