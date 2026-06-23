import {describe,expect,it,vi} from 'vitest';
import {businessMinutesBetween,calculateDueDate,getSLAConfig,getSLAStatus,getTimeRemaining} from '../lib/sla';
describe('SLA',()=>{
  it('uses configured priority targets',()=>{expect(getSLAConfig('CRITICAL').resolutionHrs).toBe(4);expect(getSLAConfig('LOW').responseHrs).toBe(24)});
  it('calculates a business-hour-aware deadline',()=>{let start=new Date('2026-01-01T09:00:00Z'),due=calculateDueDate('HIGH',start);expect(businessMinutesBetween(start,due)).toBe(8*60)});
  it('excludes non-business hours',()=>expect(businessMinutesBetween(new Date('2026-01-03T09:00:00Z'),new Date('2026-01-03T17:00:00Z'))).toBe(0));
  it('detects breached and resolved tickets',()=>{vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));expect(getSLAStatus({createdAt:new Date('2026-01-01'),dueDate:new Date('2026-01-01T04:00:00Z'),status:'OPEN'} as any)).toBe('BREACHED');expect(getSLAStatus({createdAt:new Date('2026-01-01'),dueDate:new Date('2026-01-01T04:00:00Z'),status:'RESOLVED'} as any)).toBe('ON_TRACK');vi.useRealTimers()});
  it('returns absolute remaining units and breach flag',()=>{vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));expect(getTimeRemaining(new Date('2026-01-01T02:30:00Z'))).toEqual({hours:2,minutes:30,isBreached:false});vi.useRealTimers()});
});
