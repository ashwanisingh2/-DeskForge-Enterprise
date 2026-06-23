import DOMPurify from 'isomorphic-dompurify';

const allowedTags=['p','br','strong','em','ul','ol','li','a','code','pre'];
const allowedAttrs=['href','target','rel'];
const forbiddenAttrs=['onclick','onload','onerror','onmouseover','onfocus','onblur','onchange','onsubmit'];

export function sanitizeHtml(value:string){
  return DOMPurify.sanitize(value,{ALLOWED_TAGS:allowedTags,ALLOWED_ATTR:allowedAttrs,FORBID_TAGS:['script','iframe','object','embed'],FORBID_ATTR:forbiddenAttrs});
}
