# Customer Application & Workflow Management System

An enterprise orchestration platform built to manage complex, multi-stage client petitions (immigration, student visas, corporate mobility) with strict domain isolation, deterministic state machine guards, and real-time audit trails.

## Setup Instructions

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

## Backend Architecture

The backend adopts a **Layered Domain-Driven Architecture (Routes -> Controllers -> Model Statics)** running on Node.js, Express, and MongoDB.

```
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
```

#### Why you chose the approach
##### Clear Separation of Concerns: Thin routes define declarative endpoints and RBAC guards, controllers orchestrate business logic, and Mongoose static methods handle heavy database aggregations without mixing concerns.

##### State Machine & Compliance Guards: Business validation (e.g., blocking stage advancement until all prerequisite work items are COMPLETED) is enforced at the controller level to prevent unauthorized or invalid transitions.

##### Integrated Audit Trail: Lifecycle mutations (stage changes, reassignments, task completions, file uploads) atomically and synchronously write immutable logs to the Activity collection.

##### Optimized Testability: Decoupling app configuration (app.js) from the network server bootstrap (server.js) allows Supertest and Jest to execute fast, isolated integration tests without port conflicts.

##### Centralized Error & Async Management: Global asyncHandler and AppError utilities prevent unhandled promise rejections and standardize HTTP error payloads across all endpoints.
---

## Frontend Architecture

The frontend is built on **Next.js (App Router)** and **TypeScript**, structured around a **Master-Detail Workspace Pattern** to minimize context switching.
```
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
```
---
#### Why you chose the approach
##### Master-Detail Workspace Pattern: Utilizes a high-density split-pane layout to let caseworkers navigate docket queues on the left while managing stage transitions, checklists, and audit history on the right without full-page reloads or context switching.

##### Component Reusability & Type Safety: Employs a polymorphic generic list (GenericList<T>) alongside shared UI primitives (Modal, StatusBadge), standardizing keyboard navigation, loading states, and zebra styling across all dashboards with zero code duplication.

##### Domain-Driven Assignment Scoping: Form modals dynamically filter staff assignee options strictly by the operational Team linked to the chosen Workflow, eliminating cross-department misassignments directly in the UI.

##### Centralized API & Session Client: A dedicated fetchClient encapsulates JWT authorization headers, uniform error parsing, and cookie handling across all client-side requests.

##### Optimistic Local Interactivity: Custom utilities (e.g., useDebounce) prevent API request thrashing during search, while task checklist toggling and direct file-to-task uploads provide immediate visual feedback.

## Data Model
Model Alignment Verification
Looking at your diagram, the data model aligns with the backend:

Relational Scoping: User links to Team, and CustomerApplication correctly references Customer, Workflow, assigned_to (User), and manager (User).

State Machine & Execution: Workflow embeds Stage templates (with allowed_transitions and checklist items), while WorkItem dynamically instances tasks bound to the active stage_name and points optionally to a Document via attachment_id.

Reliability & Audit: Both Activity (performer, message, timestamp) and SyncJob (idempotency key, state, retries, next run) have direct entity backing.

Here are the remaining sections structured for your documentation:

Data Model
The system follows a domain-driven data model designed to enforce operational boundaries, dynamic stage transitions, and auditability:

User & Team: Represents system actors assigned one of three roles (admin, manager, executive) linked to a specific Team for domain scoping.

Customer: Stores applicant master data (contact details, address, personal identity fields) and supports a 1-to-many relationship with applications.

Workflow & Embedded Stages: Defines the operational template. Each workflow contains ordered stages, permitted transition routes (allowed_transitions), and task definitions.

CustomerApplication: The primary state entity holding references to the customer, workflow template, assigned executive, overseeing manager, priority, operational status (ACTIVE, ON_HOLD, COMPLETED, CANCELLED), currentStage, and an incremental version counter for optimistic locking.

WorkItem: Runtime tasks provisioned for an application's current stage. Holds execution status and an optional reference to an uploaded Document.

Document: Stores metadata, file path, MIME type, and verification status for files attached to work items or customer profiles.

Activity: Append-only event store capturing immutable audit records (actor, action description, timestamp, application reference).

SyncJob: Persistent outbox queue tracking external system dispatch attempts, exponential backoff retries, error logs, and idempotency keys.


## Application Design
Communication Pattern: The Next.js frontend communicates with the Express backend via a typed RESTful API client over HTTP/JSON with cookie-based JWT sessions.

State Management: The frontend leverages local React state for UI interactivity (split-pane selection, modal workflows) and synchronizes with backend state through optimistic updates and debounced queries.

Workflow Enforcement: Stage advancement is governed by a server-side state machine. An application can only move to a stage explicitly listed in the workflow's allowed_transitions, and transitions are blocked if any active WorkItem in the current stage remains incomplete.

Concurrency Control: Updates include the application's version field. The backend checks for version matches before writing to prevent accidental overwrites when multiple users review the same record.


## Authentication and Authorization
Authentication: Stateless authentication utilizing JSON Web Tokens (JWT) signed with HMAC-SHA256, issued upon login, and stored in secure HTTP-only cookies.

Role-Based Access Control (RBAC):

Administrator: Full administrative access across all endpoints, organizational teams, workflows, and global application reassignments.

Manager: Read and write permissions scoped strictly to applications and staff within their assigned teamId.

Executive: Processing access limited to view and complete work items, attach files, and update stages for explicitly assigned applications.

Domain Scoping: Workflow assignments dynamically filter caseworker dropdowns to staff belonging to that workflow's operational team.


## External Integration
Execution Point: Synchronization dispatches asynchronously when an application transitions into its terminal COMPLETED stage.

Non-Blocking Fault Isolation: The external sync runs in an isolated try-catch block; external latency or network failures never fail the internal database transaction.

Idempotency & Retry Mechanism: Each sync creates a SyncJob record with a deterministic key (app_<id>_v<version>). If the external endpoint fails or times out, the job status moves to FAILED and schedules retries with exponential backoff up to a maximum attempt threshold.

Production Evolution: For high-throughput production, the persistent SyncJob table would be backed by a distributed message broker (e.g., Redis BullMQ, RabbitMQ, or Kafka) with dedicated worker processes and Dead-Letter Queue (DLQ) alerts.


## Assumptions and Trade-offs
File Storage (Local vs. Cloud): Multipart file uploads are stored on the local disk (/uploads) and served statically for simplicity. A production deployment would stream files directly to Amazon S3 or Google Cloud Storage using presigned URLs.

Queue Processing (In-Memory/DB Outbox vs. Dedicated Broker): Background sync retries are tracked inside MongoDB rather than a standalone Redis instance to keep dependencies minimal and self-contained.

Soft Deletes vs. State Invalidation: Applications are not permanently deleted; instead, they transition to CANCELLED status to preserve audit integrity and historical activity logs.


## Incomplete Features
Real-Time Push Notifications: Live multi-user updates currently rely on periodic re-fetching and optimistic state refreshes rather than active WebSockets (Socket.io).

Granular Field-Level Audit Diffing: The Activity collection logs high-level action messages rather than deep JSON object deltas (before/after snapshots) for each individual customer field.


## Production Considerations
Infrastructure & Storage: Migrate local file persistence to S3/GCS with private bucket access policies and presigned temporary upload/download links.

Distributed Queueing: Offload SyncJob execution to a dedicated message broker (e.g., BullMQ with Redis) to ensure horizontal scalability across multiple backend server instances.

Caching & Performance: Introduce Redis caching for read-heavy static workflow templates and team rosters, and implement database read-replicas for search queries.

Monitoring & Tracing: Instrument Express routes with OpenTelemetry or Prometheus metrics to monitor API latency, external sync failure rates, and state-machine rejection errors.

Rate Limiting


## AI and Development Tools
Gemini: Used for generating prototype code, structuring test cases, creating standard boilerplate validation schemas, and drafting architecture documentation.
