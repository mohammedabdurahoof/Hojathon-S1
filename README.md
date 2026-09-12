# AI Remedial Learning Platform

> Personalized learning that helps every student catch up and move forward.

The **AI Remedial Learning Platform** is an AI-powered education system engineered for students who are academically behind their current grade level. By analyzing concept prerequisite relationships, the platform pinpoints root knowledge gaps and constructs tailored learning pathways.

---

## 🏗️ Architecture & Core Learning Loop

```
Student → Diagnostic Assessment → Knowledge Gap Detection → Prerequisite Analysis → Personalized Learning Plan → AI Tutor → Practice → Assessment → Mastery Update → Repeat
```

For detailed architectural specifications, see [docs/architecture/overview.md](docs/architecture/overview.md).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | React framework with TypeScript & Tailwind CSS |
| **Backend** | NestJS | Node.js REST API framework with Swagger / OpenAPI |
| **Database** | PostgreSQL + Prisma ORM | Relational schema with `pgvector` ready embeddings |
| **Infrastructure** | Docker & Docker Compose | Containerized PostgreSQL 16 (`pgvector`) & Redis 7 |
| **Task Queue** | Redis + BullMQ Ready | Asynchronous job processing architecture (`ai-processing`) |
| **AI Layer** | Provider Abstraction | Agnostic `AIProvider` interface (OpenAI ready) |
| **Testing** | Jest + Supertest | Unit & API integration testing |
| **Monorepo** | npm Workspaces | Clean separation (`apps/web`, `apps/api`, `packages/*`) |

---

## 📁 Folder Structure

```
ai-remedial-learning/
│
├── apps/
│   ├── web/                     # Next.js App Router Frontend
│   │   ├── app/                 # Routes: /, /login, /dashboard, /student, /teacher, /admin
│   │   ├── components/          # Header, Sidebar, DashboardLayout, Loading/Error/Empty States
│   │   └── public/
│   │
│   └── api/                     # NestJS REST API Backend
│       └── src/
│           ├── auth/            # AuthModule
│           ├── users/           # UsersModule
│           ├── students/        # StudentsModule
│           ├── teachers/        # TeachersModule
│           ├── curriculum/      # CurriculumModule
│           ├── concepts/        # ConceptsModule
│           ├── assessments/     # AssessmentsModule
│           ├── questions/       # QuestionsModule
│           ├── mastery/         # MasteryModule
│           ├── learning-plans/  # LearningPlansModule
│           ├── ai/              # AiModule (AIProvider abstraction)
│           ├── rag/             # RagModule (RAG vector foundation)
│           ├── analytics/       # AnalyticsModule
│           ├── notifications/   # NotificationsModule
│           ├── health/          # HealthModule (GET /api/health)
│           ├── common/          # Redis & BullMQ abstraction
│           ├── prisma/          # PrismaService & PrismaModule
│           ├── app.module.ts
│           └── main.ts
│
├── packages/
│   ├── shared/                  # Shared helpers & utilities
│   ├── types/                   # Shared TypeScript interfaces & DTOs
│   └── config/                  # Shared configurations
│
├── prisma/
│   ├── schema.prisma            # 18 Core PostgreSQL domain models
│   └── seed.ts                  # Demonstration dataset & Mathematics prerequisite tree
│
├── docker/
│   └── postgres/                # init.sql (CREATE EXTENSION IF NOT EXISTS vector)
│
├── docs/
│   ├── architecture/            # overview.md (Learning loop & prerequisite engine)
│   ├── api/                     # API documentation
│   └── decisions/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 💻 Requirements

- **Node.js**: `v20.x` or higher (tested on Node v24)
- **npm**: `v10.x` or higher
- **Docker & Docker Compose**: (for PostgreSQL with `pgvector` & Redis)

---

## 🚀 Installation & Setup

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure Services (Docker)

```bash
docker-compose up -d
```

### 4. Database Setup (Prisma Migration & Seed)

Generate Prisma client:
```bash
npm run db:generate
```

Run migrations (or push schema):
```bash
npm run db:migrate
```

Seed database with demonstration curriculum & prerequisite tree:
```bash
npm run db:seed
```

---

## 🏃 Running the Application

### Start Both Frontend & Backend concurrently:
```bash
npm run dev
```

### Or start individually:
- **Backend API (NestJS)**: `npm run dev:api` (Runs on `http://localhost:3001`)
- **Frontend (Next.js)**: `npm run dev:web` (Runs on `http://localhost:3000`)

---

## 📖 API Documentation & Endpoints

Swagger OpenAPI interface is interactive and automatically generated at:
`http://localhost:3001/api/docs`

### Health Check Endpoint:
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "ai-remedial-learning-api"
}
```

---

## 🤖 Future AI Architecture (Phase 2 Readiness)

The AI infrastructure is designed using a provider-agnostic abstraction (`AIProvider` interface):

- **Text Generation**: `generateText(options)`
- **Structured Output**: `generateStructuredOutput(options)`
- **Vector Embedding**: `generateEmbedding(text)`
- **RAG Pipeline**: Document chunking (`DocumentService`) and vector context querying (`RagService`).
- **Async Queueing**: Redis and BullMQ queue registration (`ai-processing`).

This ensures provider flexibility without coupling application logic directly to specific API vendors.
