// ─── Backend-aligned type definitions ───

export type QuestionType = "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank";
export type Difficulty = "easy" | "medium" | "hard";
export type AssignmentStatus = "pending" | "processing" | "done" | "failed";

// ─── Question Paper (LLM output) ───

export interface Question {
  questionNumber: number;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];   // Only present for mcq
  answer?: string;      // Optional — used for Answer Key rendering in PDF
}

export interface Section {
  sectionLabel: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: Question[];
}

export interface ExamData {
  _id?: string;
  assignmentId?: string;
  title: string;
  subject: string;
  totalMarks: number;
  totalQuestions: number;
  sections: Section[];
  generatedAt?: string;
  modelUsed?: string;
}

export interface ExamPayload {
  data: ExamData;
}

// ─── Assignment (MongoDB document shape) ───

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface Assignment {
  _id: string;
  dueDate: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  title: string;
  subject: string;
  difficultyDistribution: DifficultyDistribution;
  additionalInstructions?: string;
  fileUrl?: string;
  filePublicId?: string;
  extractedText?: string;
  jobId?: string | null;
  status: AssignmentStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ───

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: { path: string; message: string }[];
}

export interface AssignmentCreatedData {
  assignmentId: string;
  status: AssignmentStatus;
}

export interface JobTriggeredData {
  jobId: string;
  assignmentId: string;
  status: string;
}

export interface GetResultResponse {
  success: boolean;
  cached: boolean;
  data: ExamData;
}
