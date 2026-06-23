import {ZodError} from 'zod';

export function structuredError(error:unknown){
  if(error instanceof ZodError)return{error:{code:'VALIDATION_ERROR',message:'Request validation failed',fields:error.issues.map(i=>({path:i.path.join('.'),message:i.message}))}};
  let message=error instanceof Error?error.message:'INVALID_REQUEST';
  return{error:{code:message,message}};
}
