import {withAuth} from 'next-auth/middleware';import {NextResponse} from 'next/server';
export default withAuth(function middleware(req){let res=NextResponse.next();res.headers.set('x-request-id',crypto.randomUUID());if(req.nextUrl.pathname.startsWith('/api/'))res.headers.set('Cache-Control','no-store');return res},{callbacks:{authorized:({token,req})=>req.nextUrl.pathname==='/login'||req.nextUrl.pathname==='/api/health'||!!token}});
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
