#!/usr/bin/env node
/**
 * Pre-commit secret scanner (DF-2026-010).
 * Scans staged files for high-entropy tokens and known credential patterns.
 * Exits non-zero (blocking the commit) when a likely secret is found.
 *
 * Usage:  node scripts/check-secrets.js
 * Wire into a pre-commit hook or CI step.
 */
const {execSync} = require('child_process');

const PATTERNS = [
  {name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/},
  {name: 'Resend API key', re: /re_[A-Za-z0-9]{20,}/},
  {name: 'Stripe live key', re: /sk_live_[A-Za-z0-9]{20,}/},
  {name: 'Generic API key assignment', re: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9/+=_-]{24,}['"]/i},
  {name: 'Private key block', re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/},
  {name: 'Postgres URL with password', re: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/},
  {name: 'NextAuth secret assignment', re: /NEXTAUTH_SECRET\s*=\s*['"]?[A-Za-z0-9/+=]{20,}/},
];

// Files that are allowed to contain example placeholders.
const ALLOWLIST = [/\.env\.example$/, /check-secrets\.js$/, /README/i, /CHANGELOG/i];

function stagedFiles() {
  try {
    return execSync('git diff --cached --name-only --diff-filter=ACM', {encoding: 'utf8'})
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

let findings = 0;
for (const file of stagedFiles()) {
  if (ALLOWLIST.some((re) => re.test(file))) continue;
  let content = '';
  try {
    content = execSync(`git show :${file}`, {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
  } catch {
    continue;
  }
  for (const {name, re} of PATTERNS) {
    const match = content.match(re);
    if (match) {
      console.error(`\x1b[31m✗ Potential secret (${name}) in ${file}\x1b[0m`);
      findings++;
    }
  }
}

if (findings > 0) {
  console.error(`\n${findings} potential secret(s) found. Remove them or add to allowlist before committing.`);
  process.exit(1);
}
console.log('✓ No secrets detected in staged files.');
