# VedaAI: AI Assessment Creator

VedaAI is an intelligent, full-stack application designed to automatically generate, format, and manage highly customized educational assessments. Utilizing modern AI models via OpenRouter, VedaAI provides teachers with a streamlined, responsive, and real-time dashboard to create detailed Question Papers tailored to specific grades, subjects, topics, and difficulty levels.

## Architecture Overview

```text
Browser (Next.js Client)
       │
       │ (REST / WebSockets)
       ▼
   Express API (Node.js) ─────────► MongoDB (Persistent Storage)
       │
       │ (Add Job)
       ▼
    BullMQ (Redis) 
       │
       │ (Process Job)
       ▼
 Worker (Background Service) ─────► OpenRouter / Anthropic AI
       │
       │ (Emit Job Status/Progress)
       ▼
   WebSocket Server ──────────────► Browser (Real-time updates)
```

## Tech Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | Next.js (React), Tailwind CSS, Zustand | Highly responsive, visually polished UI with global state management. |
| **Backend** | Node.js, Express, TypeScript | Robust API routing and WebSocket handling. |
| **Database** | MongoDB (Mongoose) | Persistent storage for users, assignments, and generated question papers. |
| **Message Queue & Cache** | Redis, BullMQ | Asynchronous job queuing for AI generation, rate-limiting, and caching. |
| **AI Integration** | OpenRouter (Anthropic/Mistral/Google) | LLM inference for generating structured JSON question papers. |

## Setup Instructions

### Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Running instance (local or Atlas)
- **Redis**: Running instance

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in the `.env` values (see Environment Variables below).
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
```
Fill in the `.env.local` values.
```bash
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)
| Name | Description | Example Value |
| --- | --- | --- |
| `PORT` | API Port | `5000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://localhost:27017/vedai` |
| `REDIS_URL` | Connection string for Redis | `redis://localhost:6379` |
| `OPENROUTER_API_KEY`| API key for LLM integration | `sk-or-v1-abc123...` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)
| Name | Description | Example Value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint | `http://localhost:5000/api` |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket endpoint | `ws://localhost:5000` |

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/assignments/generate` | Trigger a new AI generation job. Returns a `jobId`. |
| **GET** | `/api/assignments` | Fetch a paginated list of all generated assignments. |
| **GET** | `/api/assignments/:id` | Fetch details of a specific assignment task. |
| **GET** | `/api/papers/:assignmentId` | Fetch the final generated structured question paper. |
| **POST** | `/api/papers/:assignmentId/regenerate`| Queue a regeneration job for an existing paper. |

## Key Design Decisions

### 1. Why BullMQ?
Generating high-quality structured content via LLMs can take between 10-40 seconds. Holding an HTTP request open for that duration leads to timeouts and poor UX. BullMQ provides:
- **Background Processing:** The heavy lifting is decoupled from the main API thread.
- **Job Retries:** If the AI API fails or times out, BullMQ automatically retries the job.
- **Concurrency Control:** Prevents the backend from being overloaded by concurrent generation requests.

### 2. Why WebSockets?
Instead of forcing the client to aggressively poll the server to check if an assignment is done, WebSockets push state changes directly to the client in real-time. This creates a deeply interactive UX where the user sees immediate "Generating...", "Saving...", and "Completed" states.

### 3. Prompt Design & Structured JSON
The LLM is prompted using precise system instructions to output pure, parseable JSON conforming to a strict schema. This allows the Next.js frontend to natively map the output into a beautifully styled document (with sections, difficulties, and multiple-choice options) rather than relying on unformatted markdown. A robust fallback chain handles cases where the primary model fails.

### 4. Caching Strategy
We leverage Redis not just for BullMQ, but as a rapid-access cache. When an assignment is completed, the resulting JSON is immediately cached in Redis, mitigating database read load when multiple users access or print the same paper simultaneously.

## Docker Setup (Multi-Container)

You can easily spin up the entire application stack using Docker Compose.

```bash
# Add your API key first!
export OPENROUTER_API_KEY="your-api-key-here"

# Spin up MongoDB, Redis, Backend, and Frontend
docker-compose up --build
```
The application will be accessible at `http://localhost:3000`.

## Bonus Features Implemented
- **Mobile Responsive Design:** Flawless scaling from desktop sidebars to native-feeling mobile bottom navigation bars.
- **Print Stylesheets:** Carefully crafted `@media print` CSS ensures that generated assignments look like professional, standardized school test papers when printed or exported to PDF.
- **Model Fallback Chain:** If an LLM is temporarily down, the backend dynamically rolls over to backup models to guarantee successful generation.
