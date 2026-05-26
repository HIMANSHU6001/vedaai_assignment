import { Document, Schema, model } from 'mongoose';

export const assignmentStatuses = ['pending', 'processing', 'done', 'failed'] as const;
export type AssignmentStatus = (typeof assignmentStatuses)[number];

export const questionTypes = [
  'mcq',
  'short_answer',
  'long_answer',
  'true_false',
  'fill_blank',
] as const;
export type QuestionType = (typeof questionTypes)[number];

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: DifficultyDistribution;
  additionalInstructions?: string;
  fileUrl?: string;
  filePublicId?: string;
  extractedText?: string;
  jobId?: string;
  status: AssignmentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    dueDate: { type: Date, required: true },
    questionTypes: {
      type: [{ type: String, enum: questionTypes }],
      required: true,
      validate: {
        validator: (value: QuestionType[]) => Array.isArray(value) && value.length > 0,
        message: 'questionTypes must contain at least one item',
      },
    },
    totalQuestions: { type: Number, required: true, min: 1, max: 100 },
    totalMarks: { type: Number, required: true, min: 1, max: 500 },
    difficultyDistribution: {
      easy: { type: Number, default: 33, min: 0, max: 100 },
      medium: { type: Number, default: 34, min: 0, max: 100 },
      hard: { type: Number, default: 33, min: 0, max: 100 },
    },
    additionalInstructions: { type: String, maxlength: 2000 },
    fileUrl: { type: String },
    filePublicId: { type: String },
    extractedText: { type: String },
    jobId: { type: String },
    status: {
      type: String,
      enum: assignmentStatuses,
      default: 'pending',
      required: true,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
