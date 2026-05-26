import { z } from 'zod';

const QuestionTypeSchema = z.enum(['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank']);
const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const QuestionSchema = z.object({
  questionNumber: z.number().int().positive(),
  text: z.string().min(10),
  type: QuestionTypeSchema,
  difficulty: DifficultySchema,
  marks: z.number().int().positive().max(20),
  options: z.array(z.string().min(1)).length(4).optional(),
});

export const SectionSchema = z.object({
  sectionLabel: z.string().length(1).regex(/^[A-Z]$/),
  title: z.string().min(5),
  instruction: z.string().min(10),
  totalMarks: z.number().int().positive(),
  questions: z.array(QuestionSchema).min(1),
});

export const QuestionPaperOutputSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  totalMarks: z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  sections: z.array(SectionSchema).min(1).max(5),
});

export type QuestionPaperOutput = z.infer<typeof QuestionPaperOutputSchema>;
