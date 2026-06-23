import {readFileSync} from 'fs';
import {join} from 'path';
import {describe,expect,it} from 'vitest';
import {createAccessToken,verifyAccessToken} from '../lib/auth/tokens';
import {sanitizeHtml} from '../lib/sanitize';

describe('secure token system',()=>{
  it('creates and verifies 15-minute access tokens',()=>{
    let token=createAccessToken({id:'u1',tenantId:'t1',role:'ADMIN'});
    let claims=verifyAccessToken(token);
    expect(claims.sub).toBe('u1');
    expect(claims.tenantId).toBe('t1');
    expect(claims.exp-claims.iat).toBe(900);
  });
});

describe('sanitization',()=>{
  it('allows safe formatting and strips dangerous tags and handlers',()=>{
    let html=sanitizeHtml('<p onclick="x()">Hi <strong>there</strong><script>alert(1)</script><iframe src="/x"></iframe></p>');
    expect(html).toContain('<p>Hi <strong>there</strong></p>');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('script');
    expect(html).not.toContain('iframe');
  });
});

describe('tenant RLS migration',()=>{
  it('enables current-tenant policies on tenant tables and child records',()=>{
    let sql=readFileSync(join(__dirname,'..','prisma','migrations','20260623093000_rls_tokens_csrf','migration.sql'),'utf8');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION set_tenant_context');
    expect(sql).toContain("current_setting('app.current_tenant', true)");
    for(let table of ['"User"','"Ticket"','"KBArticle"','"Notification"','"AuditLog"','"SLAConfig"','"Asset"','"ChangeRequest"','"Problem"','"RefreshToken"']){
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain('CREATE POLICY tenant_comment');
    expect(sql).toContain('CREATE POLICY tenant_attachment');
  });
});
