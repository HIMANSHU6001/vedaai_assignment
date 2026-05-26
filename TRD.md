# VedaAI — AI Assessment Creator
## Technical Requirements Document
### Backend System — Full Specification

---

| Field | Value |
|-------|-------|
| **Scope** | Backend API, Worker, Queue, WebSocket, LLM Integration |
| **Stack** | Node.js · Express · TypeScript · MongoDB · Redis · BullMQ · LangChain · DeepSeek V3 |
| **Status** | Draft v1.0 |
| **Author** | Himanshu |
| **Date** | May 2025 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Queue & Worker Architecture](#6-queue--worker-architecture)
7. [LLM Integration — LangChain + DeepSeek V3](#7-llm-integration--langchain--deepseek-v3)
8. [WebSocket & Real-Time Notification](#8-websocket--real-time-notification)
9. [File Upload & PDF Processing](#9-file-upload--pdf-processing)
10. [Error Handling](#10-error-handling)
11. [Figma Design Alignment](#11-figma-design-alignment)
12. [Dependencies Reference](#12-dependencies-reference)

---

## 1. Overview

### 1.1 Purpose

This document is the definitive technical specification for the VedaAI backend system. It covers every design decision, data contract, API endpoint, queue architecture, LLM integration pattern, and error handling strategy required to build a production-ready backend that supports the AI Assessment Creator product.

The frontend (Next.js) is treated as an external consumer of this API. All contracts defined here are binding — the frontend will be built against these schemas without modification to the backend.

### 1.2 System Summary

A teacher submits an assignment creation form. The backend accepts the request, stores the intent, optionally processes an uploaded PDF, enqueues a background LLM generation job, and notifies the frontend in real time via WebSocket when the structured question paper is ready. The output is a fully parsed, validated, database-persisted document — never raw LLM text.

### 1.3 Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Runtime | Node.js | 20 LTS | TypeScript compiled, ts-node for dev |
| Framework | Express | 4.x | HTTP server and REST API |
| Language | TypeScript | 5.x | Strict mode enabled throughout |
| ODM | Mongoose | 8.x | MongoDB schema + query layer |
| Database | MongoDB Atlas | M0 free | Document store |
| Cache / Queue | Redis (Upstash) | — | BullMQ backing + PubSub |
| Job Queue | BullMQ | 5.x | Durable async job processing |
| Real-time | Socket.io | 4.x | WebSocket layer, rooms per jobId |
| LLM SDK | LangChain (`langchain` + `@langchain/openai`) | 0.2.x | Agent orchestration + structured output |
| LLM Model | DeepSeek V3 via DigitalOcean | deepseek-chat | OpenAI-compatible endpoint |
| Validation | Zod | 3.x | Schema validation for HTTP + LLM output |
| File Storage | Cloudinary | 2.x | PDF + file upload CDN |
| PDF Parsing | pdf-parse | 1.x | Extract text from uploaded PDFs |
| Process Manager | ts-node + nodemon | — | Dev only, hot-reload |
| Containerization | Docker / docker-compose | — | Dockerfile(s) and `docker-compose.yml` available for local orchestration |

### 1.4 Non-Goals (Backend Scope)

- No authentication or user sessions (out of scope for this assignment)
- No multi-tenancy or teacher accounts
- No rate limiting (can be added post-submission)
- No frontend rendering — backend returns data only

---

## 2. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                  # Mongoose connection
│   │   ├── redis.ts               # ioredis client factory
│   │   └── cloudinary.ts          # Cloudinary SDK init
│   ├── models/
│   │   ├── Assignment.ts          # Mongoose Assignment schema
│   │   └── QuestionPaper.ts       # Mongoose QuestionPaper schema
│   ├── routes/
│   │   ├── assignment.routes.ts   # /api/assignments endpoints
│   │   └── health.routes.ts       # GET /health
│   ├── controllers/
│   │   └── assignment.controller.ts
│   ├── services/
│   │   ├── assignment.service.ts  # Business logic
│   │   ├── cloudinary.service.ts  # Upload helper
│   │   ├── pdf.service.ts         # pdf-parse wrapper
│   │   └── queue.service.ts       # BullMQ queue singleton
│   ├── worker/
│   │   ├── worker.ts              # BullMQ Worker entry (separate process)
│   │   └── processor.ts           # Job logic: LLM call + save
│   ├── llm/
│   │   ├── agent.ts               # LangChain agent setup
│   │   ├── prompt.ts              # Prompt builder
│   │   └── schema.ts              # Zod output schema
│   ├── websocket/
│   │   ├── io.ts                  # Socket.io server singleton
│   │   └── pubsub.ts              # Redis subscriber → Socket.io emitter
│   ├── middleware/
│   │   ├── validate.ts            # Zod request validation middleware
│   │   └── error.ts               # Global error handler
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   └── app.ts                     # Express app factory
├── server.ts                      # HTTP server entry point
├── worker.ts                      # Worker entry point (separate process)
├── .env.example
├── tsconfig.json
└── package.json
```

### 2.1 Two-Process Architecture

> **CRITICAL:** The API server (`server.ts`) and the BullMQ worker (`worker.ts`) run as **two separate Node.js processes**. This is mandatory — LLM calls can take 10–30 seconds and must not block the HTTP event loop.

In development, run both processes concurrently:

```bash
# Terminal 1 — API server
npx ts-node src/server.ts

# Terminal 2 — BullMQ worker
npx ts-node src/worker/worker.ts

# Or with concurrently in package.json:
"dev": "concurrently \"nodemon --exec ts-node src/server.ts\" \"nodemon --exec ts-node src/worker/worker.ts\""
```

---

## 3. Environment Configuration

### 3.1 Required Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `PORT` | number | No | HTTP server port. Default: `4000` |
| `MONGODB_URI` | string | **Yes** | MongoDB Atlas connection string with database name |
| `REDIS_URL` | string | **Yes** | Upstash Redis URL (`redis://:password@host:port`) |
| `CLOUDINARY_CLOUD_NAME` | string | **Yes** | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | string | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | string | **Yes** | Cloudinary API secret |
| `DEEPSEEK_API_KEY` | string | **Yes** | DigitalOcean GenAI API key for DeepSeek V3 |
| `DO_BASE_URL` | string | **Yes** | DigitalOcean endpoint: `https://<agent>.agents.hosted-inference.digitaloceanspaces.com/v1` |
| `DEEPSEEK_MODEL` | string | No | Model identifier. Default: `deepseek-chat` |
| `NODE_ENV` | string | No | `development` \| `production`. Default: `development` |
| `CORS_ORIGIN` | string | No | Frontend origin for CORS. Default: `http://localhost:3000` |

### 3.2 `.env.example`

```env
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/vedaai
REDIS_URL=redis://:password@host:6379

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

DEEPSEEK_API_KEY=your_digitalocean_key
DO_BASE_URL=https://<agent>.agents.hosted-inference.digitaloceanspaces.com/v1
DEEPSEEK_MODEL=deepseek-chat

NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3.3 Redis Connection Strategy

BullMQ requires two separate `ioredis` connections: one for the Queue and one for the Worker. Redis PubSub requires a third dedicated connection (a subscribed client cannot issue regular commands). Upstash free tier supports up to 100 concurrent connections — four is fine.

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

const redisOpts = {
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,     // Required for Upstash TLS
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
};

// BullMQ queue connection
export const queueRedis = new Redis(process.env.REDIS_URL!, redisOpts);

// BullMQ worker connection
export const workerRedis = new Redis(process.env.REDIS_URL!, redisOpts);

// PubSub subscriber (dedicated — cannot share with queue/worker)
export const subRedis = new Redis(process.env.REDIS_URL!, redisOpts);

// General purpose commands (caching etc.)
export const cacheRedis = new Redis(process.env.REDIS_URL!, redisOpts);
```

---

## 4. Data Models

### 4.1 Assignment

Stores the teacher's input intent and tracks the job lifecycle. Created synchronously on form submission.

```typescript
// src/models/Assignment.ts
import { Schema, model, Document } from 'mongoose';

export type AssignmentStatus = 'pending' | 'processing' | 'done' | 'failed';
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
export type DifficultyDistribution = { easy: number; medium: number; hard: number };

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: DifficultyDistribution;
  additionalInstructions?: string;
  fileUrl?: string;          // Cloudinary secure_url
  filePublicId?: string;     // Cloudinary public_id for deletion
  extractedText?: string;    // First 3000 chars from pdf-parse
  jobId?: string;            // BullMQ job ID
  status: AssignmentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title:          { type: String, required: true, trim: true, maxlength: 200 },
  subject:        { type: String, required: true, trim: true, maxlength: 100 },
  dueDate:        { type: Date,   required: true },
  questionTypes:  {
    type: [String],
    required: true,
    enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank'],
  },
  totalQuestions: { type: Number, required: true, min: 1, max: 100 },
  totalMarks:     { type: Number, required: true, min: 1, max: 500 },
  difficultyDistribution: {
    easy:   { type: Number, default: 33, min: 0, max: 100 },
    medium: { type: Number, default: 34, min: 0, max: 100 },
    hard:   { type: Number, default: 33, min: 0, max: 100 },
  },
  additionalInstructions: { type: String, maxlength: 2000 },
  fileUrl:        { type: String },
  filePublicId:   { type: String },
  extractedText:  { type: String },
  jobId:          { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'done', 'failed'],
    default: 'pending',
  },
  errorMessage:   { type: String },
}, { timestamps: true });

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
```

### 4.2 QuestionPaper

Stores the fully parsed, structured output from the LLM. Linked 1:1 with an Assignment document. Always validated by Zod before being saved — raw LLM text is never persisted.

```typescript
// src/models/QuestionPaper.ts
import { Schema, model, Document, Types } from 'mongoose';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface IQuestion {
  questionNumber: number;
  text: string;
  type: string;           // mcq | short_answer | long_answer | true_false | fill_blank
  difficulty: Difficulty;
  marks: number;
  options?: string[];     // MCQ choices only — undefined for other types
}

export interface ISection {
  sectionLabel: string;   // 'A', 'B', 'C'...
  title: string;          // e.g. 'Multiple Choice Questions'
  instruction: string;    // e.g. 'Attempt all questions. Each carries 2 marks.'
  totalMarks: number;     // Sum of question marks in this section
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
}

const QuestionSchema = new Schema<IQuestion>({
  questionNumber: { type: Number, required: true },
  text:           { type: String, required: true },
  type:           { type: String, required: true },
  difficulty:     { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks:          { type: Number, required: true, min: 0 },
  options:        [{ type: String }],
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  sectionLabel: { type: String, required: true },
  title:        { type: String, required: true },
  instruction:  { type: String, required: true },
  totalMarks:   { type: Number, required: true },
  questions:    [QuestionSchema],
}, { _id: false });

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  assignmentId:     { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
  title:            { type: String, required: true },
  subject:          { type: String, required: true },
  totalMarks:       { type: Number, required: true },
  totalQuestions:   { type: Number, required: true },
  sections:         [SectionSchema],
  generatedAt:      { type: Date, default: Date.now },
  modelUsed:        { type: String, required: true },
  promptTokens:     { type: Number },
  completionTokens: { type: Number },
}, { timestamps: true });

export const QuestionPaper = model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
```

---

## 5. API Endpoints

**Base URL:** `/api`

All endpoints return JSON.

- **Error shape:** `{ success: false, error: string, details?: any }`
- **Success shape:** `{ success: true, data: any }`

---

### 5.1 Health Check

#### `GET /health`

Used by deployment platforms (Railway, Render) to verify the service is alive. Returns status of all infrastructure dependencies.

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2025-05-26T10:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

### 5.2 Create Assignment

#### `POST /api/assignments`

Accepts `multipart/form-data` (to support optional file upload). Creates the Assignment document with status `pending`. Does **not** trigger generation — that is a separate call. Returns the `assignmentId` immediately.

**Request — `multipart/form-data`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Assignment title. Max 200 chars. |
| `subject` | string | **Yes** | Subject name. Max 100 chars. |
| `dueDate` | ISO 8601 string | **Yes** | Due date. Must be a future date. |
| `questionTypes` | JSON array string | **Yes** | e.g. `'["mcq","short_answer"]'` |
| `totalQuestions` | number string | **Yes** | 1–100. No decimals. |
| `totalMarks` | number string | **Yes** | 1–500. No decimals. |
| `difficultyDistribution` | JSON object string | No | `{ easy, medium, hard }` — must sum to 100 |
| `additionalInstructions` | string | No | Max 2000 chars. |
| `file` | File (PDF/TXT) | No | Max 10MB. PDF or plain text only. |

**Response 201**
```json
{
  "success": true,
  "data": {
    "assignmentId": "664f3c2a1b2c3d4e5f6a7b8c",
    "status": "pending"
  }
}
```

**Validation Rules (Zod)**

- `title` and `subject`: non-empty strings after trim
- `dueDate`: must parse as `Date` and be >= tomorrow
- `questionTypes`: non-empty array, each item from the allowed enum
- `totalQuestions`: integer, 1–100
- `totalMarks`: integer, 1–500
- `difficultyDistribution.easy + .medium + .hard` must `=== 100`
- `file`: if present, mimetype must be `application/pdf` or `text/plain`, size <= 10MB

**Zod Schema**
```typescript
// src/middleware/validate.ts
import { z } from 'zod';

export const CreateAssignmentSchema = z.object({
  title:          z.string().trim().min(1).max(200),
  subject:        z.string().trim().min(1).max(100),
  dueDate:        z.string().refine(d => new Date(d) > new Date(), {
                    message: 'Due date must be in the future'
                  }),
  questionTypes:  z.preprocess(
                    val => JSON.parse(val as string),
                    z.array(z.enum(['mcq','short_answer','long_answer','true_false','fill_blank'])).min(1)
                  ),
  totalQuestions: z.preprocess(Number, z.number().int().min(1).max(100)),
  totalMarks:     z.preprocess(Number, z.number().int().min(1).max(500)),
  difficultyDistribution: z.preprocess(
    val => val ? JSON.parse(val as string) : { easy: 33, medium: 34, hard: 33 },
    z.object({
      easy:   z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard:   z.number().min(0).max(100),
    }).refine(d => d.easy + d.medium + d.hard === 100, {
      message: 'Difficulty percentages must sum to 100'
    })
  ).optional(),
  additionalInstructions: z.string().max(2000).optional(),
});
```

---

### 5.3 Trigger Generation

#### `POST /api/assignments/:id/generate`

Enqueues a BullMQ job for the given assignment. Idempotent — if a job is already in progress for this assignment, returns the existing `jobId` without creating a duplicate. Updates assignment status to `processing`.

**URL Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | MongoDB ObjectId string | **Yes** | The `assignmentId` from step 5.2 |

**Response 202**
```json
{
  "success": true,
  "data": {
    "jobId": "bull-job-id-string",
    "assignmentId": "664f3c2a1b2c3d4e5f6a7b8c",
    "status": "processing"
  }
}
```

**Idempotency Logic**
```typescript
// In assignment.service.ts
if (assignment.status === 'processing' && assignment.jobId) {
  const existing = await generationQueue.getJob(assignment.jobId);
  if (existing && !['completed', 'failed'].includes(await existing.getState())) {
    return { jobId: assignment.jobId, status: 'processing' }; // Return existing
  }
}
```

---

### 5.4 Get Assignment Status

#### `GET /api/assignments/:id/status`

Polling fallback for clients where WebSocket is unavailable or drops. Returns current status and `jobId`.

**Response 200**
```json
{
  "success": true,
  "data": {
    "assignmentId": "664f3c2a1b2c3d4e5f6a7b8c",
    "status": "done",
    "jobId": "bull-job-id-string",
    "errorMessage": null
  }
}
```

---

### 5.5 Get Question Paper

#### `GET /api/assignments/:id/result`

Returns the full structured question paper. Checks Redis cache first (TTL 1 hour), falls back to MongoDB. Only callable when assignment status is `done`.

**Response 200**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "_id": "...",
    "assignmentId": "664f3c2a1b2c3d4e5f6a7b8c",
    "title": "Mid-Term Examination",
    "subject": "Computer Science",
    "totalMarks": 100,
    "totalQuestions": 20,
    "sections": [
      {
        "sectionLabel": "A",
        "title": "Multiple Choice Questions",
        "instruction": "Attempt all questions. Each carries 2 marks.",
        "totalMarks": 20,
        "questions": [
          {
            "questionNumber": 1,
            "text": "Which data structure uses LIFO order?",
            "type": "mcq",
            "difficulty": "easy",
            "marks": 2,
            "options": ["Queue", "Stack", "Tree", "Graph"]
          }
        ]
      }
    ],
    "generatedAt": "2025-05-26T10:05:00.000Z",
    "modelUsed": "deepseek-chat"
  }
}
```

**Response 404 (not ready)**
```json
{
  "success": false,
  "error": "Question paper not ready. Current status: processing"
}
```

**Cache Logic**
```typescript
// In assignment.service.ts
const cached = await cacheRedis.get(`paper:${assignmentId}`);
if (cached) {
  return { data: JSON.parse(cached), cached: true };
}
const paper = await QuestionPaper.findOne({ assignmentId });
return { data: paper, cached: false };
```

---

### 5.6 List Assignments

#### `GET /api/assignments`

Returns all assignments sorted by `createdAt` descending. Used by the Inbox / Library tabs from the Figma design.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | Page number. Default: `1` |
| `limit` | number | No | Items per page. Default: `10`, max: `50` |
| `status` | string | No | Filter: `pending` \| `processing` \| `done` \| `failed` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "assignments": [...],
    "total": 42,
    "page": 1,
    "totalPages": 5
  }
}
```

---

## 6. Queue & Worker Architecture

### 6.1 BullMQ Queue Setup

```typescript
// src/services/queue.service.ts
import { Queue } from 'bullmq';
import { queueRedis } from '../config/redis';

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>('question-generation', {
  connection: queueRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,          // Retries at 5s, 10s, 20s
    },
    removeOnComplete: { age: 3600 },   // Keep completed jobs 1 hour
    removeOnFail:     { age: 86400 },  // Keep failed jobs 24 hours
  },
});
```

### 6.2 Job Processor

The processor is the core of the backend — it orchestrates PDF extraction, prompt construction, LangChain agent invocation, Zod validation, MongoDB persistence, and Redis PubSub notification.

```typescript
// src/worker/processor.ts
import { Job } from 'bullmq';
import { GenerationJobData } from '../services/queue.service';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { runGenerationAgent } from '../llm/agent';
import { buildPrompt } from '../llm/prompt';
import { cacheRedis } from '../config/redis';
import { publishJobEvent } from '../websocket/pubsub';

export async function processGenerationJob(job: Job<GenerationJobData>) {
  const { assignmentId } = job.data;

  // 1. Load assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  // 2. Update status → processing + notify frontend
  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
  await publishJobEvent(assignmentId, { status: 'processing' });

  // 3. Build prompt from assignment fields
  const prompt = buildPrompt(assignment);

  // 4. Run LangChain agent — returns Zod-validated structured output
  const result = await runGenerationAgent(prompt);

  // 5. Save QuestionPaper (upsert — safe for retries)
  const paper = await QuestionPaper.findOneAndUpdate(
    { assignmentId },
    {
      ...result,
      assignmentId,
      modelUsed: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      generatedAt: new Date(),
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 6. Update assignment status → done
  await Assignment.findByIdAndUpdate(assignmentId, { status: 'done' });

  // 7. Cache result in Redis (TTL: 1 hour)
  await cacheRedis.setex(`paper:${assignmentId}`, 3600, JSON.stringify(paper));

  // 8. Publish done event — WebSocket layer picks this up
  await publishJobEvent(assignmentId, { status: 'done', paperId: paper._id });

  return { paperId: paper._id };
}
```

### 6.3 Worker Entry Point

```typescript
// src/worker/worker.ts
import { Worker } from 'bullmq';
import { workerRedis } from '../config/redis';
import { processGenerationJob } from './processor';
import { connectDB } from '../config/db';
import { Assignment } from '../models/Assignment';
import { publishJobEvent } from '../websocket/pubsub';

async function startWorker() {
  await connectDB();
  console.log('[Worker] MongoDB connected');

  const worker = new Worker('question-generation', processGenerationJob, {
    connection: workerRedis,
    concurrency: 2,  // Process 2 jobs simultaneously max
  });

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed`, result);
  });

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    if (job?.data.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });
      await publishJobEvent(job.data.assignmentId, {
        status: 'failed',
        error: err.message,
      });
    }
  });

  console.log('[Worker] Listening for jobs on queue: question-generation');
}

startWorker();
```

### 6.4 Retry Strategy

| Attempt | Delay | Outcome |
|---------|-------|---------|
| 1 | Immediate | First try |
| 2 | 5s | Exponential backoff |
| 3 | 10s | Final attempt |
| After 3 failures | — | Permanent fail — publishes `job:failed`, updates MongoDB |

---

## 7. LLM Integration — LangChain + DeepSeek V3

### 7.1 Model Initialization

DeepSeek V3 is accessed via DigitalOcean's managed inference endpoint, which is fully OpenAI-compatible. LangChain's `ChatOpenAI` class is used with a custom `baseURL` — no custom provider code needed.

```typescript
// src/llm/agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { QuestionPaperOutputSchema } from './schema';
import { SYSTEM_PROMPT } from './prompt';

export function createModel() {
  return new ChatOpenAI({
    modelName: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    openAIApiKey: process.env.DEEPSEEK_API_KEY!,
    configuration: {
      baseURL: process.env.DO_BASE_URL!,
    },
    temperature: 0.7,
    maxTokens: 4096,
  });
}

export async function runGenerationAgent(userPrompt: string) {
  const model = createModel();

  // withStructuredOutput enforces Zod schema via function-calling
  const structuredModel = model.withStructuredOutput(QuestionPaperOutputSchema, {
    name: 'generate_question_paper',
  });

  const result = await structuredModel.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  // result is already Zod-validated by LangChain
  return result;
}
```

> **Note:** `withStructuredOutput` uses LangChain's function-calling path. If the DigitalOcean DeepSeek endpoint does not support tool/function calls, fall back to JSON mode: append the Zod schema as a JSON example in the system prompt, call the model normally, strip any markdown fences, and `JSON.parse` + `QuestionPaperOutputSchema.parse()` the response manually.

### 7.2 Zod Output Schema

This schema is the **single source of truth** for LLM output structure. LangChain's `withStructuredOutput` uses it to generate the function call definition AND to validate the response. If DeepSeek returns data that does not match this schema, LangChain throws before the data reaches the processor.

```typescript
// src/llm/schema.ts
import { z } from 'zod';

const QuestionSchema = z.object({
  questionNumber: z.number().int().positive(),
  text: z
    .string()
    .min(10)
    .describe('The full question text'),
  type: z.enum(['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().positive().max(20),
  options: z
    .array(z.string())
    .length(4)
    .optional()
    .describe('Required for mcq type only — exactly 4 options'),
});

const SectionSchema = z.object({
  sectionLabel: z
    .string()
    .length(1)
    .describe('Single uppercase letter: A, B, C'),
  title: z
    .string()
    .min(5)
    .describe('Section title e.g. Multiple Choice Questions'),
  instruction: z
    .string()
    .min(10)
    .describe('Instruction for students e.g. Attempt all questions'),
  totalMarks: z.number().int().positive(),
  questions: z.array(QuestionSchema).min(1),
});

export const QuestionPaperOutputSchema = z.object({
  title:          z.string().describe('Formal exam paper title'),
  subject:        z.string(),
  totalMarks:     z.number().int().positive(),
  totalQuestions: z.number().int().positive(),
  sections:       z.array(SectionSchema).min(1).max(5),
}).describe('Structured question paper with sections and questions');

export type QuestionPaperOutput = z.infer<typeof QuestionPaperOutputSchema>;
```

### 7.3 Prompt Builder

The prompt is constructed programmatically from the Assignment document fields. If extracted PDF text is present, it is injected as context — capped at 2500 characters to stay within token limits.

```typescript
// src/llm/prompt.ts
import { IAssignment } from '../models/Assignment';

export const SYSTEM_PROMPT = `You are an expert educational assessment designer.
Your task is to generate a structured, professional question paper.

Rules you MUST follow:
- Generate exactly the number of questions specified
- Total marks across all questions MUST equal the requested total exactly
- Distribute questions across sections by question type (one section per type)
- Apply difficulty distribution as close to the requested percentages as possible
- MCQ questions MUST include an options array with exactly 4 choices
- Question text must be academically appropriate and unambiguous
- Section labels must be sequential uppercase letters: A, B, C...
- Do not add questions beyond the specified count
- Do not include answers or answer keys`;

export function buildPrompt(assignment: IAssignment): string {
  const { easy, medium, hard } = assignment.difficultyDistribution;

  const easyCount   = Math.round(assignment.totalQuestions * easy / 100);
  const medCount    = Math.round(assignment.totalQuestions * medium / 100);
  const hardCount   = assignment.totalQuestions - easyCount - medCount;
  const marksPerQ   = Math.floor(assignment.totalMarks / assignment.totalQuestions);

  let prompt = `Generate a question paper with these exact specifications:

Title: ${assignment.title}
Subject: ${assignment.subject}
Total Questions: ${assignment.totalQuestions}
Total Marks: ${assignment.totalMarks}
Approximate marks per question: ${marksPerQ}
Question types to include: ${assignment.questionTypes.join(', ')}

Difficulty breakdown:
- Easy questions:   ${easyCount}
- Medium questions: ${medCount}
- Hard questions:   ${hardCount}

Group questions into sections by type.
Each section gets a letter label (A, B, C...) and a descriptive title.
Section instruction should indicate how many questions and marks are in that section.`;

  if (assignment.additionalInstructions) {
    prompt += `\n\nAdditional instructions from the teacher:\n${assignment.additionalInstructions}`;
  }

  if (assignment.extractedText) {
    const ctx = assignment.extractedText.slice(0, 2500);
    prompt += `\n\nBase the questions on the following study material (excerpt):\n---\n${ctx}\n---`;
  }

  return prompt;
}
```

---

## 8. WebSocket & Real-Time Notification

### 8.1 Architecture

Socket.io attaches to the same HTTP server as Express. The worker publishes events to a Redis PubSub channel. A dedicated subscriber inside the API server listens and emits Socket.io events to the appropriate room. This fully decouples the worker from WebSocket — the worker only needs Redis.

```
Worker process                      API server process
──────────────────────              ──────────────────────────────────────
processGenerationJob()    →         Redis PubSub channel: 'job:events'
  publishJobEvent(id, data)                   ↓
                               subRedis.subscribe('job:events')
                                              ↓
                               io.to(assignmentId).emit('job:update', data)
                                              ↓
                               Frontend socket in room 'assignmentId' receives it
```

### 8.2 Socket.io Server

```typescript
// src/websocket/io.ts
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: Server;

export function initSocketIO(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],  // Polling fallback for restricted networks
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    // Client joins a room keyed by assignmentId
    socket.on('join', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`[WS] ${socket.id} joined room: ${assignmentId}`);
      // Immediately send current status in case client reconnected mid-job
      socket.emit('joined', { assignmentId });
    });

    socket.on('disconnect', () => {
      console.log('[WS] Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized — call initSocketIO first');
  return io;
}
```

### 8.3 Redis PubSub Bridge

```typescript
// src/websocket/pubsub.ts
import { subRedis, cacheRedis } from '../config/redis';
import { getIO } from './io';

const CHANNEL = 'job:events';

export async function publishJobEvent(assignmentId: string, data: object): Promise<void> {
  const payload = JSON.stringify({ assignmentId, ...data });
  await cacheRedis.publish(CHANNEL, payload);
}

export function startPubSubBridge(): void {
  subRedis.subscribe(CHANNEL, (err) => {
    if (err) console.error('[PubSub] Subscribe error:', err);
    else     console.log('[PubSub] Subscribed to channel:', CHANNEL);
  });

  subRedis.on('message', (channel, message) => {
    if (channel !== CHANNEL) return;
    try {
      const payload = JSON.parse(message);
      const { assignmentId, ...data } = payload;
      getIO().to(assignmentId).emit('job:update', data);
      console.log(`[PubSub] Emitted to room ${assignmentId}:`, data.status);
    } catch (e) {
      console.error('[PubSub] Malformed message:', message);
    }
  });
}
```

### 8.4 WebSocket Event Contract

Events the frontend receives on the `job:update` listener:

| `status` value | Full payload | Frontend action |
|---------------|--------------|-----------------|
| `"processing"` | `{ status: "processing" }` | Show spinner / progress indicator |
| `"done"` | `{ status: "done", paperId: "<ObjectId>" }` | Fetch `GET /api/assignments/:id/result` and render |
| `"failed"` | `{ status: "failed", error: "<message>" }` | Show error toast with Retry button |

### 8.5 Server Entry Point

```typescript
// src/server.ts
import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { connectDB } from './config/db';
import { initSocketIO } from './websocket/io';
import { startPubSubBridge } from './websocket/pubsub';

const PORT = process.env.PORT ?? 4000;

async function start() {
  await connectDB();
  console.log('[Server] MongoDB connected');

  const httpServer = http.createServer(app);
  initSocketIO(httpServer);
  startPubSubBridge();

  httpServer.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
  });
}

start();
```

---

## 9. File Upload & PDF Processing

### 9.1 Multer Configuration

```typescript
// src/middleware/upload.ts
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),       // Buffer in memory — passed to Cloudinary stream
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and plain text files are accepted'));
  },
});
```

### 9.2 Cloudinary Upload

```typescript
// src/services/cloudinary.service.ts
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export async function uploadToCloudinary(
  buffer: Buffer,
  originalname: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'vedaai-assignments',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}
```

### 9.3 PDF Text Extraction

Text extraction happens during `POST /api/assignments`, **not** in the worker. The extracted text is stored on the Assignment document so the worker can use it without re-downloading the file from Cloudinary.

```typescript
// src/services/pdf.service.ts
import pdfParse from 'pdf-parse';

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text.slice(0, 3000).trim();
  }
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').slice(0, 3000).trim();
  }
  return '';
}
```

### 9.4 Controller Flow for POST /api/assignments

```typescript
// src/controllers/assignment.controller.ts (create action)
export async function createAssignment(req: Request, res: Response) {
  // 1. Validate body with Zod
  const body = CreateAssignmentSchema.parse(req.body);

  let fileUrl: string | undefined;
  let filePublicId: string | undefined;
  let extractedText: string | undefined;

  // 2. Handle file if present
  if (req.file) {
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    fileUrl = url;
    filePublicId = publicId;
    extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
  }

  // 3. Create Assignment document
  const assignment = await Assignment.create({
    ...body,
    fileUrl,
    filePublicId,
    extractedText,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    data: { assignmentId: assignment._id, status: assignment.status },
  });
}
```

---

## 10. Error Handling

### 10.1 HTTP Error Responses

| Code | Status | When |
|------|--------|------|
| `400` | Bad Request | Zod validation failed. Body contains `details` array. |
| `404` | Not Found | Assignment or QuestionPaper document not found. |
| `409` | Conflict | Generation already in progress for this assignment. |
| `413` | Payload Too Large | File upload exceeds 10MB limit. |
| `422` | Unprocessable Entity | Assignment found but status prevents this action. |
| `500` | Internal Server Error | Unexpected failure. Stack trace hidden in production. |

### 10.2 Global Error Middleware

```typescript
// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  // Multer file size exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File exceeds 10MB limit' });
  }

  const status = err.statusCode ?? err.status ?? 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

  res.status(status).json({ success: false, error: message });
}
```

### 10.3 LLM Failure Modes

| Failure | Cause | Handling |
|---------|-------|----------|
| Schema mismatch | LLM returned wrong shape | `withStructuredOutput` throws `ZodError` — job fails and retries |
| Timeout (>30s) | Slow network or model | `axios` timeout propagates — BullMQ retries with backoff |
| Empty sections | LLM returned `sections: []` | Explicit guard in processor — throw before saving |
| Rate limit (429) | Too many requests | Exponential backoff handles — rarely triggered on DigitalOcean endpoint |
| API key invalid | Wrong env var | `401` from DeepSeek — job fails immediately, no retry |

---

## 11. Figma Design Alignment

### 11.1 Navigation Tabs

The Figma design shows two primary tabs: **Inbox** and **Library**. The `GET /api/assignments` endpoint with `status` query param covers this:

- **Inbox** → filter by `status=pending` or `status=processing`
- **Library** → filter by `status=done`

### 11.2 Output Page Field Mapping

The QuestionPaper schema is designed to drive the Figma output layout directly — no frontend transformation needed.

| UI Element | Backend Field | Notes |
|-----------|---------------|-------|
| Student info section | — (frontend renders blank inputs) | Name, Roll No, Section are filled by student |
| Section heading (e.g. "Section A") | `section.sectionLabel` | Backend returns `"A"`, `"B"`, `"C"` |
| Section title | `section.title` | e.g. `"Multiple Choice Questions"` |
| Section instruction | `section.instruction` | e.g. `"Attempt all. Each carries 2 marks."` |
| Question number | `question.questionNumber` | Sequential integer |
| Question text | `question.text` | Full question string |
| Difficulty badge | `question.difficulty` | `easy` → green, `medium` → amber, `hard` → red |
| Marks badge | `question.marks` | e.g. `2 marks` |
| MCQ options list | `question.options[]` | Present only when `type === "mcq"` |

### 11.3 Regenerate Flow

When the teacher clicks Regenerate, the frontend calls `POST /api/assignments/:id/generate` again. The backend detects an existing QuestionPaper, deletes it, resets status, and enqueues a fresh job. The WebSocket loop then handles the rest identically to first generation.

```typescript
// In assignment.service.ts — triggerGeneration action
export async function triggerGeneration(assignmentId: string) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw createError(404, 'Assignment not found');

  // Idempotency check
  if (assignment.status === 'processing' && assignment.jobId) {
    const existing = await generationQueue.getJob(assignment.jobId);
    if (existing && !['completed', 'failed'].includes(await existing.getState())) {
      return { jobId: assignment.jobId, status: 'processing' };
    }
  }

  // Regenerate path: delete old paper + cache
  await QuestionPaper.deleteOne({ assignmentId });
  await cacheRedis.del(`paper:${assignmentId}`);

  // Reset assignment
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'pending',
    jobId: null,
    errorMessage: null,
  });

  // Enqueue fresh job
  const job = await generationQueue.add('generate', { assignmentId });
  await Assignment.findByIdAndUpdate(assignmentId, { jobId: job.id });

  return { jobId: job.id, assignmentId, status: 'processing' };
}
```

---

## 12. Dependencies Reference

### 12.1 `package.json`

```json
{
  "name": "vedaai-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"nodemon --exec ts-node src/server.ts\" \"nodemon --exec ts-node src/worker/worker.ts\"",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:worker": "node dist/worker/worker.js"
  },
  "dependencies": {
    "@langchain/openai": "^0.2.0",
    "bullmq": "^5.0.0",
    "cloudinary": "^2.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "ioredis": "^5.3.0",
    "langchain": "^0.2.0",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5",
    "pdf-parse": "^1.1.1",
    "socket.io": "^4.7.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.0.0",
    "@types/pdf-parse": "^1.1.4",
    "concurrently": "^8.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.3.0"
  }
}
```

### 12.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 12.3 Installation & Run

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Development (runs both server + worker)
npm run dev

# Production build
npm run build

# Production start (two terminals or two Railway services)
npm run start
npm run start:worker
```

### Docker / Compose

The repository includes Dockerfiles for the backend and frontend and a `docker-compose.yml` for local orchestration of the services (API server, worker, Redis, MongoDB, etc.). To bring up the full stack locally using Docker Compose:

```bash
# Build and start all services in detached mode
docker compose up --build -d

# View logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

Note: The backend `DockerFIle` (backend Dockerfile) is configured for a two-stage build; the `docker-compose.yml` overrides the default command for the worker and starts both the API and worker containers when configured.

---

*VedaAI Backend TRD — Draft v1.0 — Himanshu, NIT Rourkela*