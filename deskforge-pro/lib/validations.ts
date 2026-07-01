import {z} from 'zod';import {sanitizeHtml} from './sanitize';const clean=(v:string)=>sanitizeHtml(v);export const ticketSchema=z.object({title:z.string().min(4).max(150),description:z.string().min(10).transform(clean),priority:z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),category:z.string().min(2),subcategory:z.string().optional(),assigneeId:z.string().nullable().optional(),tags:z.array(z.string()).default([]),impact:z.string().optional(),urgency:z.string().optional(),source:z.string().optional()});export const commentSchema=z.object({content:z.string().min(1).max(10000).transform(clean),isInternal:z.boolean().default(false)});

export const kbArticleSchema=z.object({
  title:z.string().min(4).max(200),
  content:z.string().min(10).max(50000).transform(clean),
  category:z.string().min(2).max(60),
  status:z.enum(['draft','published']).default('published'),
  tags:z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const kbVoteSchema=z.object({helpful:z.boolean()});
