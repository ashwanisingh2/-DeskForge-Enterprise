import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/session';
import {revokeAllUserSessions} from '@/lib/auth/refresh-token';
import {clearAuthCookies} from '@/lib/auth/cookies';

export async function POST(){
  let user=await requireUser();
  await revokeAllUserSessions(user.id);
  let res=NextResponse.json({ok:true});
  clearAuthCookies(res);
  return res;
}
