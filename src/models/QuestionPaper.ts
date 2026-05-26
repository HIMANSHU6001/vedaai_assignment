import { Document, Schema, Types, model } from 'mongoose';

export const difficulties = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof difficulties)[number];

export interface IQuestion {
  questionNumber: number;
  text: string;
  type: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  sectionLabel: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: Types.ObjectId;
  title: string;
  subject: string;
  totalMarks: number;
  totalQuestions: number;
  sections: ISection[];
  generatedAt: Date;
  modelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: { type: Number, required: true },
    text: { type: String, required: true },
    type: { type: String, required: true },
    difficulty: { type: String, enum: difficulties, required: true },
    marks: { type: Number, required: true, min: 0 },
    options: { type: [String], required: false },
    answer: { type: String, required: false },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    sectionLabel: { type: String, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false }
);

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    generatedAt: { type: Date, default: Date.now },
    modelUsed: { type: String, required: true },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
  },
  { timestamps: true }
);

export const QuestionPaper = model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
