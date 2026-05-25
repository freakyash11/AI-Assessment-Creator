import { z } from 'zod';

export const createAssessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(1, 'Subject is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  numQuestions: z
    .number()
    .int()
    .min(1, 'At least 1 question required')
    .max(50, 'Maximum 50 questions'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
