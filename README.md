# Customer Application & Workflow Management System

An enterprise orchestration platform built to manage complex, multi-stage client petitions (immigration, student visas, corporate mobility) with strict domain isolation, deterministic state machine guards, and real-time audit trails.

## Backend Architecture

The backend adopts a **Layered Domain-Driven Architecture (Routes -> Controllers -> Model Statics)** running on Node.js, Express, and MongoDB.

backend-service/
├── src/
│   ├── config/             # Database connection & Swagger OpenAPI specs
│   ├── controllers/        # Request parsing, HTTP status codes, orchestration
│   ├── middlewares/        # JWT Authentication, RBAC (protect, restrictTo)
│   ├── models/             # Mongoose schemas, indexes, and static query pipelines
│   ├── routes/             # Lean route-to-middleware mappings
│   ├── seeds/              # Seed fixtures (teams, workflows, staff, dockets)
│   ├── utils/              # Custom AppError, asyncHandler wrapper
│   ├── app.js              # Express app initialization & static asset mounting
│   └── server.js           # Server bootstrap & process lifecycle handlers
└── tests/                  # API integration and unit test suites
---

## Frontend Architecture

The frontend is built on **Next.js (App Router)** and **TypeScript**, structured around a **Master-Detail Workspace Pattern** to minimize context switching.

frontend-service/
├── src/
│   ├── app/                # Next.js App Router routes (dockets, customers, auth)
│   ├── components/         # Atomic & compound UI components
│   │   ├── ActivityTimeline.tsx       # Immutable audit history renderer
│   │   ├── CreateApplicationModal.tsx # Multi-step docket lodge modal
│   │   ├── DocketHeader.tsx          # Stage progression state controls
│   │   ├── GenericList.tsx           # Polymorphic selectable list component
│   │   ├── Modal.tsx                 # Base dialog container (portal, ESC trap)
│   │   ├── StatusBadge.tsx           # Semantic badge styler
│   │   └── WorkItemList.tsx          # Task checklist & multipart file uploader
│   ├── hooks/              # Custom hooks (useDebounce, pagination state)
│   ├── lib/                # Configured API client (fetchClient with auto-JWT)
│   └── types/              # Domain TypeScript interfaces
---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or MongoDB Atlas URI

### Backend Setup
```bash
cd backend-service
npm install
cp .env.example .env
npm run dev
```

### Database Seeding
To populate default teams, workflows, users, and dockets:
node src/seeds/seed.js
```bash
npm run seed
```

### Frontend Setup
```bash
cd frontend-service
npm install
cp .env.example .env.local
npm run dev
```

### Testing

Backend Test Suite: Run npm test inside /backend-service
Frontend Test Suite: Run npm test inside /frontend-service
