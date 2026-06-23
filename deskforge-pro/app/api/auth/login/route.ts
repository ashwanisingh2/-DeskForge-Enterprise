import {randomUUID} from 'crypto';
import bcrypt from 'bcryptjs';
import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {createAccessToken} from '@/lib/auth/tokens';
import {createRefreshToken} from '@/lib/auth/refresh-token';
import {setAuthCookies} from '@/lib/auth/cookies';

export async function POST(req:NextRequest){
  let {username,password}=await req.json().catch(()=>({}));
  username=String(username||'').trim().toLowerCase();
  let user=username?await prisma.user.findUnique({where:{username}}):null;
  if(!user?.isActive||!password||!await bcrypt.compare(String(password),user.password))return NextResponse.json({error:{code:'INVALID_CREDENTIALS',message:'Invalid username or password'}},{status:401});
  let accessToken=createAccessToken({id:user.id,tenantId:user.tenantId,role:user.role,email:user.email,name:user.name}),refresh=await createRefreshToken({id:user.id,tenantId:user.tenantId},req.headers.get('user-agent')||undefined),csrfToken=randomUUID(),res=NextResponse.json({accessToken,csrfToken,expiresIn:900,user:{id:user.id,name:user.name,email:user.email,role:user.role,tenantId:user.tenantId}});
  setAuthCookies(res,accessToken,refresh.token,refresh.expiresAt);
  res.cookies.set('deskforge_csrf',csrfToken,{httpOnly:false,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
  return res;
}
