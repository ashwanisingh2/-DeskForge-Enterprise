import {NextRequest,NextResponse} from 'next/server';
import {createAccessToken} from '@/lib/auth/tokens';
import {refreshCookieName,rotateRefreshToken} from '@/lib/auth/refresh-token';
import {setAuthCookies} from '@/lib/auth/cookies';

export async function POST(req:NextRequest){
  try{
    let token=req.cookies.get(refreshCookieName)?.value;
    if(!token)return NextResponse.json({error:{code:'REFRESH_REQUIRED',message:'Missing refresh token'}},{status:401});
    let {refresh,user}=await rotateRefreshToken(token,req.headers.get('user-agent')||undefined);
    let access=createAccessToken({id:user.id,tenantId:user.tenantId,role:user.role,email:user.email,name:user.name});
    let res=NextResponse.json({accessToken:access,expiresIn:900});
    setAuthCookies(res,access,refresh.token,refresh.expiresAt);
    return res;
  }catch{
    return NextResponse.json({error:{code:'INVALID_REFRESH_TOKEN',message:'Refresh token is invalid or expired'}},{status:401});
  }
}
