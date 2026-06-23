import {describe,expect,it} from 'vitest';
import {parseEmail,ticketIdFromReferences} from '../lib/email/email-parser';

describe('email parser',()=>{
  it('extracts sender, ticket reference and sanitizes body',()=>{
    let parsed=parseEmail({from:{value:[{address:'User@Example.com'}]},subject:'Re: TKT-0042 help',html:'<p>Hello<script>x</script></p>',references:['abc']} as any);
    expect(parsed.from).toBe('user@example.com');
    expect(parsed.body).not.toContain('script');
    expect(ticketIdFromReferences(parsed.subject,parsed.references)).toBe('TKT-0042');
  });
});
