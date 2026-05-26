# VedaAI — AI Assessment Creator (Backend & Worker)

VedaAI is a powerful platform that automates structured academic question paper generation using Large Language Models (LLMs). The backend system is built on a high-throughput, **two-process architecture** designed to handle complex question paper constraints and PDF processing without blocking API responses.

For detailed design specifications, database contracts, API schemas, and queue details, refer to the [Technical Requirements Document (TRD.md)](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md).

---

## ⚡ Quickstart Guide

Get the backend API server and background worker running locally in just a few steps.

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v20 LTS recommended)
- **npm** (v10+)
- **MongoDB** (Atlas cluster or a local instance)
- **Redis** (Upstash Redis or a local instance)

### 2. Environment Setup
Clone the repository, go to the root directory, and copy the environment variables template:
```bash
cp .env.example .env
```
Open `.env` and fill in the required credentials:
- MongoDB connection URI (`MONGODB_URI`)
- Redis URL (`REDIS_URL`)
- Cloudinary credentials (`CLOUDINARY_*`) for PDF uploads
- DigitalOcean GenAI/DeepSeek credentials (`DEEPSEEK_API_KEY` and `DO_BASE_URL`)

### 3. Install Dependencies
Install all required Node.js and TypeScript packages:
```bash
npm install
```

### 4. Run Development Servers
VedaAI uses a **two-process system** (Express API + BullMQ Worker) to keep the API responsive during heavy LLM generations. 

Run the following command to start **both** processes concurrently with hot-reloading:
```bash
npm run dev
```

* **Express API Gateway** will start on: `http://localhost:4000`
* **Background Worker** will start listening for jobs on the `question-generation` Redis queue.

---

## 🐳 Running with Docker

You can run the entire VedaAI stack (Frontend, Backend, and Redis) orchestrated together using Docker Compose.

From the root directory:
```bash
# Start all services (api, worker, frontend, and redis)
docker compose up --build
```

---

## 🛠️ Project Architecture & Commands

### NPM Scripts
- `npm run dev`: Runs the API server and BullMQ worker concurrently with hot-reload (`nodemon` + `ts-node`).
- `npm run build`: Compiles TypeScript files into JavaScript in the `/dist` directory.
- `npm run start`: Runs the compiled production API gateway.
- `npm run start:worker`: Runs the compiled background queue worker.

---

## 📄 Technical Reference Document (TRD)

All comprehensive architecture specifications are documented in the **[TRD.md](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md)**. Please refer to it for:
- [System Architecture Overview](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#1-overview)
- [Project Directory Structure](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#2-project-structure)
- [Environment Configurations](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#3-environment-configuration)
- [Mongoose Schemas & Types (Assignment, QuestionPaper)](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#4-data-models)
- [REST API Endpoints & Request/Response Contracts](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#5-api-endpoints)
- [BullMQ Job Queue & Retry Architecture](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#6-queue--worker-architecture)
- [LangChain & DeepSeek V3/V4 Integration Specs](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#7-llm-integration--langchain--deepseek-v3)
- [Socket.io Room Websocket Specification](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#8-websocket--real-time-notification)
- [Multer, pdf-parse, and Cloudinary pipelines](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/TRD.md#9-file-upload--pdf-processing)
