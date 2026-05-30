import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2).max(80),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1),
});

export const createFormSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(3).max(120),
});

export const patchFormSchema = z.object({
  isOpen: z.boolean(),
});

export const feedbackEntrySchema = z.object({
  targetUserId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  strengths: z.string().min(3).max(2000),
  improvements: z.string().min(3).max(2000),
});

export const submitFeedbackSchema = z.object({
  formId: z.string().min(1),
  submittedByUserId: z.string().min(1),
  feedback: z.array(feedbackEntrySchema).min(1),
});

export const summarizeSchema = z.object({
  formId: z.string().min(1),
  targetUserId: z.string().min(1),
});
