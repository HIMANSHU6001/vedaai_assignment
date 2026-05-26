# VedaAI — AI Assessment Creator (Frontend Client)

This is the Next.js frontend client for VedaAI, an academic assessment creator powered by AI. It provides an intuitive, high-performance web interface styled with modern typography, harmonic color palettes, glassmorphism, and responsive CSS layouts.

For comprehensive technical specifications, frontend architecture, and state management details, see the **[Frontend TRD.md](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md)**.

---

## ⚡ Quickstart Guide

Get the frontend Next.js development server running locally in just a few steps.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v20+ recommended)
- **npm** (v10+)

### 2. Environment Setup
From the `/frontend` directory, copy the environment variables example file:
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_URL` points to the active VedaAI backend API Gateway (default: `http://localhost:4000`).

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
Start the local Next.js client dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🏗️ Core Features & Views

The client leverages a dual-tab dashboard workflow and real-time state synchronization:
1. **Inbox / Library Dashboard**: List existing assignments, review creation statuses, and browse previously generated papers.
2. **Assessment Creation Form**: A robust multipart form (supporting file drag-and-drop, question limits, and precise marks/difficulty distributions).
3. **Real-time Live Generation Overlay**: WebSocket listener updates Zustand store and shows active generation progress while backend processes the job.
4. **Physical Exam Preview & PDF Export**: A printable academic exam paper rendering with action buttons to download as a structured PDF.

---

## 🛠️ Tech Stack & Scripts
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Real-Time Integration**: Socket.io-client
- **PDF Export**: `@react-pdf/renderer`

### NPM Scripts
- `npm run dev`: Launches Next.js dev server on http://localhost:3000 (accessible network-wide).
- `npm run build`: Builds the production bundle of the application.
- `npm run start`: Starts the production Next.js server.
- `npm run lint`: Runs ESLint to check for standard rules and code quality.

---

## 📄 Technical Reference Document (TRD)

Detailed implementations and technical breakdowns are available in the **[frontend/TRD.md](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md)**:
- [Overview & Frameworks](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#1-overview)
- [Project Structure Diagram](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#2-project-structure)
- [Zustand Global State Store Contract](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#3-state-management-zustand)
- [WebSocket / Socket.io Room Lifecycle Hook](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#4-real-time-integration-websocket)
- [Multi-part Form & Result Fetching API Flows](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#5-api-data-flow--submissions)
- [Component Structure (Form, Layout, Result Screen)](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#6-ui-components-layout)
- [Environment Configurations & Docker Compose Settings](file:///c:/Users/Himanshu/Desktop/vedaai_assignment/frontend/TRD.md#7-environment-configuration)
