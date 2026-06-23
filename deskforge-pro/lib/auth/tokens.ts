import {createHmac,timingSafeEqual} from 'crypto';

export type AccessTokenClaims={sub:string;tenantId:string;role:string;email?:string|null;name?:string|null;exp:number;iat:number};
function secret(){return process.env.ACCESS_TOKEN_SECRET||process.env.NEXTAUTH_SECRET||'local-development-secret-change-before-production'}
function b64url(input:Buffer|string){return Buffer.from(input).toString('base64url')}
function sign(data:string){return createHmac('sha256',secret()).update(data).digest('base64url')}

export function createAccessToken(user:{id:string;tenantId:string;role:string;email?:string|null;name?:string|null},ttlSeconds=900){
  let now=Math.floor(Date.now()/1000),claims:AccessTokenClaims={sub:user.id,tenantId:user.tenantId,role:user.role,email:user.email,name:user.name,iat:now,exp:now+ttlSeconds};
  let body=`${b64url(JSON.stringify({alg:'HS256',typ:'JWT'}))}.${b64url(JSON.stringify(claims))}`;
  return `${body}.${sign(body)}`;
}

export function verifyAccessToken(token:string){
  let parts=token.split('.');
  if(parts.length!==3)throw new Error('INVALID_TOKEN');
  let expected=sign(`${parts[0]}.${parts[1]}`),actual=parts[2];
  if(expected.length!==actual.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))throw new Error('INVALID_TOKEN');
  let claims=JSON.parse(Buffer.from(parts[1],'base64url').toString()) as AccessTokenClaims;
  if(!claims.exp||claims.exp<Math.floor(Date.now()/1000))throw new Error('TOKEN_EXPIRED');
  return claims;
}
