import type {NextAuthOptions} from 'next-auth';
import {randomUUID} from 'crypto';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import {prisma} from './prisma';
import {clearLoginAttempts, consumeLoginAttempt} from './rate-limit';
import {createAccessToken} from './auth/tokens';
import {createRefreshToken, accessCookieName, refreshCookieName} from './auth/refresh-token';
import {demoUser, isLocalDemo} from './demo-data';

/** In demo mode (LOCAL_DEMO_NO_DB), only the admin/admin123 account is accepted. */
function localDemoUser(username: string, password?: string) {
  if (!isLocalDemo() || username !== 'admin' || password !== 'admin123') return null;
  return demoUser as any;
}

export const authOptions: NextAuthOptions = {
  // 30-minute idle timeout that rolls forward on activity (updateAge). Short-lived
  // 15-minute access tokens + rotating refresh tokens are issued separately below.
  session: {strategy: 'jwt', maxAge: 30 * 60, updateAge: 5 * 60},
  pages: {signIn: '/login'},
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: {label: 'Username', type: 'text'},
        password: {label: 'Password', type: 'password'},
      },
      /**
       * Verifies credentials with a rate-limited, audited login flow.
       * Returns the authenticated user object, or null on failure.
       */
      async authorize(c, req) {
        const username = c?.username?.trim().toLowerCase() || '';
        const ip = String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown')
          .split(',')[0]
          .trim();
        const userAgent = String(req.headers?.['user-agent'] || 'unknown');
        const key = `${ip}:${username}`;

        // Rate limit per ip:username before touching the database.
        const rate = await consumeLoginAttempt(key);
        if (!rate.allowed) throw new Error(`RATE_LIMITED:${rate.retryAfter}`);

        // Demo bypass (no DB).
        const demo = localDemoUser(username, c?.password);
        if (demo) {
          await clearLoginAttempts(key);
          return demo;
        }

        try {
          const user = username ? await prisma.user.findUnique({where: {username}}) : null;
          const success = !!(
            user?.isActive &&
            user.tenantId &&
            c?.password &&
            (await bcrypt.compare(c.password, user.password))
          );

          // Record every attempt (best-effort) for audit / security analytics.
          await prisma.loginEvent
            .create({
              data: {
                tenantId: user?.tenantId,
                userId: user?.id,
                username,
                success,
                reason: success ? null : user?.isActive === false ? 'INACTIVE' : 'INVALID_CREDENTIALS',
                ipAddress: ip,
                userAgent,
              },
            })
            .catch(() => undefined);

          if (!success) return null;
          await clearLoginAttempts(key);
          return {id: user!.id, name: user!.name, email: user!.email, role: user!.role, tenantId: user!.tenantId} as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /** Enriches the JWT with id/role/tenant, a CSRF token, and short-lived access + rotating refresh tokens. */
    async jwt({token, user}) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.csrfToken = randomUUID();
        token.accessToken = createAccessToken(user as any);
        if (!isLocalDemo()) {
          try {
            const refresh = await createRefreshToken({id: user.id, tenantId: (user as any).tenantId}, 'nextauth');
            token.refreshToken = refresh.token;
          } catch {
            // Refresh token creation is best-effort; login still succeeds without it.
          }
        }
      }
      return token;
    },
    /** Exposes claims and tokens on the session object for the client. */
    async session({session, token}) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).csrfToken = token.csrfToken;
        (session as any).accessToken = token.accessToken;
        (session as any)[refreshCookieName] = token.refreshToken;
        (session as any)[accessCookieName] = token.accessToken;
      }
      return session;
    },
  },
};
