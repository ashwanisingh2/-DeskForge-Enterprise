import {describe,expect,it} from 'vitest';
import {allowedTransitions,assertTransition,lifecycleDates} from '../lib/ticket-lifecycle';
describe('ticket lifecycle',()=>{
  it('accepts strict ITSM flow',()=>{expect(()=>assertTransition('OPEN','IN_PROGRESS')).not.toThrow();expect(()=>assertTransition('IN_PROGRESS','PENDING_CUSTOMER')).not.toThrow();expect(()=>assertTransition('PENDING_CUSTOMER','IN_PROGRESS')).not.toThrow();expect(()=>assertTransition('RESOLVED','CLOSED')).not.toThrow()});
  it('rejects invalid shortcuts and exposes allowed transitions',()=>{expect(allowedTransitions('OPEN')).toEqual(['IN_PROGRESS','PENDING_CUSTOMER','ON_HOLD']);expect(()=>assertTransition('OPEN','RESOLVED')).toThrow('INVALID_TRANSITION')});
  it('sets resolution and close timestamps',()=>{expect(lifecycleDates('RESOLVED').resolvedAt).toBeInstanceOf(Date);expect(lifecycleDates('CLOSED').closedAt).toBeInstanceOf(Date)});
  it('clears lifecycle dates when reopened',()=>expect(lifecycleDates('IN_PROGRESS')).toEqual({resolvedAt:null,closedAt:null}));
});
