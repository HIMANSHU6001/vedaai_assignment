import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const CreateAssignmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(100),
  dueDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: 'Due date must be in the future',
  }),
  questionTypes: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val as string) : val),
    z.array(z.enum(['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank'])).min(1)
  ),
  totalQuestions: z.preprocess(Number, z.number().int().min(1).max(100)),
  totalMarks: z.preprocess(Number, z.number().int().min(1).max(500)),
  difficultyDistribution: z
    .preprocess(
      (val) => (val ? (typeof val === 'string' ? JSON.parse(val as string) : val) : undefined),
      z
        .object({
          easy: z.number().min(0).max(100),
          medium: z.number().min(0).max(100),
          hard: z.number().min(0).max(100),
        })
        .refine((d) => d.easy + d.medium + d.hard === 100, {
          message: 'Difficulty percentages must sum to 100',
        })
    )
    .optional(),
  additionalInstructions: z.string().max(2000).optional(),
});

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed as any;
      return next();
    } catch (err) {
      console.error('[ValidateBody] Validation error caught:', err);
      return next(err instanceof ZodError ? err : new Error('Validation failed'));
    }
  };
}
