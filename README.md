# Customer Application & Workflow Management System

An enterprise orchestration platform built to manage complex, multi-stage client petitions (immigration, student visas, corporate mobility) with strict domain isolation, deterministic state machine guards, and real-time audit trails.

---

## 1. System Architecture

┌──────────────────────────────────────────┐
│          Next.js App Router UI           │
│   (Split-Pane Workspace, Modals, Forms)  │
└────────────────────┬─────────────────────┘
                     │ HTTP / JSON API
                     ▼
┌──────────────────────────────────────────┐
│       Express.js API Gateway / Layer      │
│  (Auth Guards, RBAC, Domain Interceptors) │
└─────────┬─────────────────────────────────┘
          │                     
┌─────────▼─────────────┐        
│ Controllers / Handlers│        
└──────────┬────────────┘     
           │ Direct Service/Model Calls
           ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Mongoose Data Layer                          │
│   (State Machine Hooks, Aggregation Pipelines, Static Methods)     │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                                  ▼
                      ┌───────────────────────────┐
                      │      MongoDB Database     │
                      │ (ACID Transactions & Data)│
                      └───────────────────────────┘

---

## 2. Backend Architecture

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

* **Thin Route Layer:** Routes exclusively handle URI mapping, parameter extraction, and authorization middleware attachment (`protect`, `restrictTo`).
* **Controller Layer:** Validates inputs, handles cross-entity business constraints, orchestrates audit logging, and constructs clean HTTP responses.
* **Model Static Pipelines:** Complex operations (such as multi-collection analytics, stage-item lookups, and workload distributions) are encapsulated within Mongoose schema static methods.
* **Audit & Synchronization Engine:** Every operational mutation (stage advance, reassignment, task completion, document attachment) synchronously writes an immutable entry to the `Activity` collection and queues idempotent sync records via `SyncJob`.

---

## 3. Frontend Architecture

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

* **Split-Pane Master-Detail Layout:** High-density left rail for searching and paginating docket queues; right pane acts as a live inspection workspace displaying current stage controls, pending checklist items, and audit timelines.
* **Dynamic Scoping Engine:** Changing the workflow in creation modals automatically fetches and locks the executive assignee dropdown to staff members belonging strictly to that workflow's operational team.
* **Optimistic Local Interactivity:** Search inputs use custom 300ms debouncing, and list-level action indicators reflect upload and save states instantly without triggering full page reloads.

---

## 4. Engineering Decisions & Rationale

### 1. Eliminating $N+1$ Queries via MongoDB Aggregation Pipelines
* **Problem:** Fetching staff workloads originally required fetching all users and running 4 sequential `countDocuments` queries in a JavaScript loop for each user (counting active dockets, pending tasks, team assignments, etc.). Under moderate load, this caused latency spikes of ~800ms.
* **Decision:** Migrated the entire workload computation into a single MongoDB aggregation pipeline utilizing `$lookup`, `$group`, `$cond`, and `$facet` within a static model method (`User.findWithWorkloadStats`).
* **Impact:** Reduced response times from ~800ms to <30ms, completely offloading heavy computation to database indexes.

---

### 2. Workflow Domain Scoping & Organizational Isolation
* **Problem:** In enterprise petition management, caseworkers handle distinct country units (e.g., Canada PR, UK Work Visa, Germany Blue Card). A global dropdown allowed accidental cross-assignment of dockets to unqualified staff in unrelated divisions.
* **Decision:** Bound workflows directly to dedicated operational teams (`teamId`). When a manager selects a workflow, the API strictly scopes available assignees to staff belonging to that unit, while system administrators retain universal oversight (`isUniversal`).
* **Impact:** Enforces clean separation of concerns and prevents cross-domain assignment errors.

---

### 3. Task-Gated Stage Transitions (Deterministic State Machine)
* **Problem:** Caseworkers could prematurely advance application stages without finishing mandatory prerequisite steps, leading to compliance failures and missing client records.
* **Decision:** Implemented a strict pre-transition check in `applicationController.updateApplicationStage`. The engine queries active stage work items and throws a `400 Bad Request` if any task remains uncompleted (`status !== "COMPLETED"`).
* **Impact:** Guarantees business compliance before an application can advance to subsequent phases.

---

### 4. Idempotent Stage Work-Item Provisioning
* **Problem:** When an application transitions backward due to re-work or client edits, re-entering a previous stage risked spawning duplicate tasks and inflating task metrics.
* **Decision:** Stage work-item generation uses idempotent provisioning: the engine checks if work items for that stage already exist. If found, it resets their status rather than inserting duplicate documents.
* **Impact:** Eliminates orphaned database records and ensures metrics remain accurate during stage rollbacks.

---

### 5. Multi-part File Attachment with Real-Time Mutation Linking
* **Problem:** Disconnected file upload workflows required staff to upload files to a storage page, copy file IDs, and manually link them back to task items.
* **Decision:** Streamlined document attachment directly within the `WorkItemList` UI. Uploading a file creates the `Document` record, patches `workItem.attachmentId`, marks the task as `COMPLETED`, and logs an immutable `Activity` audit trail in one contiguous flow.
* **Impact:** Reduces casework overhead to a single click while automatically maintaining an audit trail.

---

### 6. Polymorphic `<GenericList<T>>` with High-Density Layout
* **Problem:** Managing separate list rendering, loading skeletons, selection indicators, and zebra striping across Customers, Applications, and Workflows led to UI divergence and duplicated state logic.
* **Decision:** Built a type-safe `<GenericList<T>>` component with generic props (`renderItem`, `getId`, `onSelect`, `zebra`) and wrapped it in lightweight domain components.
* **Impact:** Standardized keyboard navigation, zebra styling, and active selection state across all platform dashboards with zero code duplication.

---

## 5. Getting Started

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

### 6. Testing

Backend Test Suite: Run npm test inside /backend-service
Frontend Test Suite: Run npm test inside /frontend-service
