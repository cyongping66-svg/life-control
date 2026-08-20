import { z } from 'zod';

export const idSchema = z.string().uuid();
export const dateSchema = z.string().datetime();

export const sourceCardSchema = z.object({
  id: idSchema,
  platform: z.enum(['official', 'bilibili', 'douyin', 'xiaohongshu', 'other']),
  title: z.string(),
  summary: z.string(),
  author: z.string().nullable(),
  url: z.string().url(),
  publishedAt: dateSchema.nullable(),
  verifiedAt: dateSchema,
  interactionCount: z.number().int().nonnegative().nullable(),
});
export type SourceCard = z.infer<typeof sourceCardSchema>;

export const askQuestionSchema = z.object({
  question: z.string().trim().min(2).max(2000),
});
export type AskQuestion = z.infer<typeof askQuestionSchema>;

export const answerSchema = z.object({
  id: idSchema,
  answer: z.string(),
  category: z.enum(['finance', 'career', 'social', 'general']),
  disclaimer: z.string().nullable(),
  sources: z.array(sourceCardSchema),
  createdAt: dateSchema,
});
export type Answer = z.infer<typeof answerSchema>;

export const financeItemSchema = z.object({
  id: idSchema,
  kind: z.enum(['bank-card', 'payment-account', 'loan', 'credit']),
  institution: z.string().min(1).max(100),
  alias: z.string().max(100).nullable(),
  lastFour: z
    .string()
    .regex(/^\d{4}$/)
    .nullable(),
  billingDay: z.number().int().min(1).max(31).nullable(),
  repaymentDay: z.number().int().min(1).max(31).nullable(),
  note: z.string().max(500).nullable(),
});
export type FinanceItem = z.infer<typeof financeItemSchema>;

export const careerItemSchema = z.object({
  id: idSchema,
  kind: z.enum(['goal', 'resume', 'side-project']),
  title: z.string().min(1).max(120),
  status: z.enum(['planned', 'active', 'paused', 'completed']),
  targetDate: dateSchema.nullable(),
  note: z.string().max(2000).nullable(),
});
export type CareerItem = z.infer<typeof careerItemSchema>;

export const contactSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
  className: z.string().max(100).nullable(),
  phone: z.string().max(30).nullable(),
  birthday: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .nullable(),
  photoKey: z.string().nullable(),
  note: z.string().max(1000).nullable(),
});
export type Contact = z.infer<typeof contactSchema>;

export const reminderSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(120),
  remindAt: dateSchema,
  channel: z.enum(['in-app', 'wechat']),
  status: z.enum(['pending', 'sent', 'cancelled', 'failed']),
});
export type Reminder = z.infer<typeof reminderSchema>;

export type ApiResponse<T> = { data: T; requestId: string };
