import {NextResponse} from 'next/server';
import {accessCookieName,refreshCookieName} from './refresh-token';

const accessTokenMaxAge=900;

export function setAuthCookies(res:NextResponse,accessToken:string,refreshToken:string,refreshExpires:Date){
  let secure=process.env.NODE_ENV==='production';
  res.cookies.set(accessCookieName,accessToken,{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:accessTokenMaxAge});
  res.cookies.set(refreshCookieName,refreshToken,{httpOnly:true,secure,sameSite:'lax',path:'/api/auth',expires:refreshExpires});
}

export function clearAuthCookies(res:NextResponse){
  res.cookies.set(accessCookieName,'',{path:'/',maxAge:0});
  res.cookies.set(refreshCookieName,'',{path:'/api/auth',maxAge:0});
}
