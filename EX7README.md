# OBE Management System — UML Sequence and Activity Modeling

**Session 7 Deliverable:** Sequence Diagrams and Activity Diagrams

This document models the dynamic behaviour of the OBE Management System. Sequence diagrams show **how objects collaborate over time**; activity diagrams show **the workflow and decision logic** behind the most important user journeys. The scenarios are drawn from the use cases in [EX5README.md](EX5README.md), the domain classes in [EX6README.md](EX6README.md), and the role workflow in [FLOW.md](FLOW.md).

## 1. Scope and Scenario Selection

The following scenarios carry the highest functional and architectural risk, so they are modelled in detail:

| ID | Scenario | Type | Primary use case |
|---|---|---|---|
| SD-01 | Login and role-based route/API authorization | Sequence | UC-01 |
| SD-02 | Define a course outcome | Sequence | UC-05 |
| SD-03 | Record marks manually or import them in bulk | Sequence | UC-11 |
| SD-04 | Calculate CO and PO attainment asynchronously | Sequence | UC-12, UC-13, UC-14 |
| SD-05 | Generate and download an attainment report | Sequence | UC-16 |
| SD-06 | Student views their own attainment | Sequence | UC-19 |
| AD-01 | Faculty marks-entry workflow | Activity | UC-11 |
| AD-02 | End-to-end attainment and reporting workflow | Activity | UC-12, UC-16 |
| AD-03 | CO-PO mapping approval workflow | Activity | UC-07, UC-08 |

## 2. Sequence Diagrams

### 2.1 SD-01 — Login and Role-Based Authorization

```mermaid
sequenceDiagram
    autonumber
    actor U as Admin / HoD / Faculty / Student
    participant WEB as Next.js App
    participant AUTH as Supabase Auth
    participant API as Express API
    participant DB as PostgreSQL

    U->>WEB: Submit email and password
    WEB->>AUTH: signInWithPassword(email, password)
    alt Invalid credentials
        AUTH-->>WEB: Authentication error
        WEB-->>U: Show generic "invalid email or password"
    else Valid credentials
        AUTH-->>WEB: Signed JWT + refresh token
        WEB->>WEB: Store session in HTTP-only cookie
        WEB->>WEB: Middleware reads role claim and checks route
        alt Route not allowed for role
            WEB-->>U: Redirect to role landing page
        else Route allowed
            WEB->>API: GET /api/v1/resource (Bearer JWT)
            API->>API: Verify JWT signature and claims locally
            API->>DB: Query with role/department session context
            DB->>DB: Apply Row-Level Security policy
            DB-->>API: Only permitted rows
            API-->>WEB: 200 OK + JSON
            WEB-->>U: Render page with role-scoped data
        end
    end
```

**Design notes**

- The JWT is never stored in `localStorage`; the HTTP-only cookie prevents token theft through XSS.
- Authorization is checked three times: middleware (page), API (route), and RLS (row). A failure at any layer is denied, not repaired.
- The API is stateless; it derives role and department from the token on every request.

### 2.2 SD-02 — Define a Course Outcome

```mermaid
sequenceDiagram
    autonumber
    actor F as Faculty
    participant WEB as Next.js App
    participant API as Express API
    participant DB as PostgreSQL

    F->>WEB: Open Course → Course Outcomes
    WEB->>API: GET /api/v1/courses/{courseId}/outcomes
    API->>DB: SELECT outcomes for course
    DB-->>API: Existing COs
    API-->>WEB: 200 OK
    WEB-->>F: Render CO list and form

    F->>WEB: Submit CO code, statement, Bloom level
    WEB->>WEB: Validate with shared Zod schema
    WEB->>API: POST /api/v1/courses/{courseId}/outcomes
    API->>API: Verify JWT, role, and course ownership
    API->>DB: Check unique (course_id, code)
    alt Duplicate CO code
        DB-->>API: Unique violation
        API-->>WEB: 409 Conflict + field error
        WEB-->>F: Highlight code field
    else Valid CO
        API->>DB: BEGIN
        API->>DB: INSERT course_outcomes
        API->>DB: INSERT audit_logs
        API->>DB: COMMIT
        DB-->>API: Created CO
        API-->>WEB: 201 Created + CO
        WEB-->>F: Show CO and refresh coverage
    end
```

**Design notes**

- The API re-validates every field; the frontend validation is only a usability shortcut.
- Course ownership is checked before the insert, so a faculty member cannot write to another faculty member's course.
- The insert and audit entry share one transaction, so an audited change cannot be lost.

### 2.3 SD-03 — Record Marks Manually or Import in Bulk

```mermaid
sequenceDiagram
    autonumber
    actor F as Faculty
    participant WEB as Next.js App
    participant API as Express API
    participant DB as PostgreSQL
    participant STORE as Supabase Storage
    participant Q as BullMQ / Redis
    participant W as Attainment Worker

    F->>WEB: Open Assessment → Marks Entry
    WEB->>API: GET /api/v1/assessments/{id}/marks-grid
    API->>DB: Load students, questions, existing marks
    DB-->>API: Grid data
    API-->>WEB: 200 OK
    WEB-->>F: Render students × questions grid

    alt Manual entry
        F->>WEB: Enter marks and select Save
        WEB->>API: PUT /api/v1/assessments/{id}/marks
        API->>API: Validate range, enrollment, question ownership
        API->>DB: BEGIN
        API->>DB: Upsert marks (one row per student/question)
        API->>DB: Insert audit_logs (summary)
        API->>DB: COMMIT
        API->>API: Invalidate attainment cache
        API-->>WEB: 200 OK + summary
        WEB-->>F: Show saved state
    else Bulk import
        F->>WEB: Upload CSV/XLSX
        WEB->>API: POST /api/v1/assessments/{id}/imports
        API->>STORE: Upload source file
        STORE-->>API: Storage path
        API->>DB: INSERT import_job (QUEUED)
        API->>Q: Enqueue import job
        API-->>WEB: 202 Accepted + jobId
        WEB-->>F: Show "import in progress"

        Q->>W: Deliver import job
        W->>STORE: Download source file
        W->>W: Parse and validate every row
        alt Validation errors
            W->>DB: Mark job FAILED with row errors
            WEB->>API: GET /api/v1/imports/{jobId}
            API-->>WEB: Row-level error report
            WEB-->>F: Show errors + download option
        else All rows valid
            W->>DB: BEGIN
            W->>DB: Upsert marks transactionally
            W->>DB: Mark job COMPLETED
            W->>DB: COMMIT
            W->>Q: Emit marks.updated event
            W->>DB: Invalidate/flag attainment cache
            WEB->>API: GET /api/v1/imports/{jobId}
            API-->>WEB: COMPLETED + summary
            WEB-->>F: Show import summary
        end
    end
```

**Design notes**

- Manual saves are synchronous because the payload is small and the user expects immediate feedback.
- Bulk imports are asynchronous because file size and validation time are unbounded; the HTTP request only enqueues work.
- The import is all-or-nothing by default (BR-MARK-04) to prevent a partially updated grade book.
- `NULL` marks are preserved as absent; the worker never converts them to zero.

### 2.4 SD-04 — Calculate CO and PO Attainment

```mermaid
sequenceDiagram
    autonumber
    actor F as Faculty / HoD
    participant WEB as Next.js App
    participant API as Express API
    participant DB as PostgreSQL
    participant Q as BullMQ / Redis
    participant W as Attainment Worker
    participant C as Redis Cache

    F->>WEB: Select course and Run Attainment
    WEB->>API: POST /api/v1/courses/{id}/attainment-runs
    API->>DB: Check prerequisites (marks, mappings, policy)
    alt Prerequisites missing
        DB-->>API: Missing marks or unapproved mapping
        API-->>WEB: 422 Unprocessable Entity + reasons
        WEB-->>F: Show blocking checklist
    else Prerequisites satisfied
        API->>DB: INSERT attainment_snapshot (RUNNING)
        API->>Q: Enqueue attainment job (snapshotId, policyId, mappingVersion)
        API-->>WEB: 202 Accepted + jobId
        WEB-->>F: Show run progress

        Q->>W: Deliver attainment job
        W->>DB: Load marks, question-CO tags, CO-PO weights, policy
        DB-->>W: Snapshot inputs
        W->>W: Compute student-level CO scores
        W->>W: Compute CO attainment using policy method
        W->>W: Roll up PO attainment by mapping weight
        W->>DB: BEGIN
        W->>DB: INSERT co_attainments
        W->>DB: INSERT student_co_attainments
        W->>DB: INSERT po_attainments
        W->>DB: UPDATE snapshot COMPLETED
        W->>DB: INSERT audit_logs
        W->>DB: COMMIT
        W->>C: Invalidate course/department dashboard keys
        W->>Q: Emit attainment.completed event
        WEB->>API: GET /api/v1/attainment-runs/{jobId}
        API-->>WEB: COMPLETED + snapshot summary
        WEB-->>F: Show CO/PO results
    end
```

**Design notes**

- The snapshot is created before the job runs, giving the worker a stable ID and the UI a pollable resource.
- The job captures `policyId` and `mappingVersion`; if a mapping changes mid-run, the run still uses the captured inputs, preserving reproducibility.
- Results and the snapshot status update in one transaction. A failure leaves the snapshot `FAILED`, never half-populated.
- Cache invalidation happens only after commit, so readers never see stale results presented as fresh.

### 2.5 SD-05 — Generate and Download a Report

```mermaid
sequenceDiagram
    autonumber
    actor F as Faculty / HoD
    participant WEB as Next.js App
    participant API as Express API
    participant DB as PostgreSQL
    participant Q as BullMQ / Redis
    participant W as Report Worker
    participant STORE as Supabase Storage

    F->>WEB: Select Export → Excel or PDF
    WEB->>API: POST /api/v1/reports
    API->>DB: Check snapshot exists and scope is authorized
    alt No snapshot
        API-->>WEB: 409 Conflict + "run attainment first"
        WEB-->>F: Offer Run Attainment
    else Snapshot available
        API->>DB: INSERT report (QUEUED)
        API->>Q: Enqueue report job (reportId, snapshotId)
        API-->>WEB: 202 Accepted + reportId
        WEB-->>F: Show queued state

        Q->>W: Deliver report job
        W->>DB: Load snapshot, CO/PO results, mapping matrix
        W->>W: Render XLSX or PDF
        W->>STORE: Upload generated file
        STORE-->>W: Storage path
        W->>DB: UPDATE report READY + file path
        W->>DB: INSERT audit_logs
        W->>Q: Emit report.ready event

        WEB->>API: GET /api/v1/reports/{id}
        API->>DB: Read report metadata
        API->>STORE: Create signed URL (short TTL)
        API-->>WEB: READY + signed URL
        WEB-->>F: Download report
    end
```

**Design notes**

- Report files are generated from a snapshot, never from live tables, so a downloaded report can always be reproduced.
- Signed URLs are short-lived; the object remains in storage under the retention policy.
- The report worker is separate from the attainment worker so a long PDF render does not delay attainment calculations.

### 2.6 SD-06 — Student Views Their Own Attainment

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant WEB as Next.js App
    participant API as Express API
    participant DB as PostgreSQL

    S->>WEB: Open My Courses → Attainment
    WEB->>API: GET /api/v1/me/attainment?courseId=...
    API->>API: Verify JWT and STUDENT role
    API->>DB: Query snapshots with student_id = token.sub
    DB->>DB: Apply RLS: student_id = current_user
    alt Results not published
        DB-->>API: Empty published result set
        API-->>WEB: 200 OK + pending state
        WEB-->>S: Show "results pending"
    else Published results exist
        DB-->>API: Own marks, student CO attainment, course PO summary
        API-->>WEB: 200 OK + student-scoped JSON
        WEB-->>S: Render personal attainment view
    end
```

**Design notes**

- The query is scoped by the authenticated subject, not by a client-supplied student ID.
- RLS provides a second barrier if the API filter is ever bypassed.
- Students see published snapshots only; draft runs are invisible.

## 3. Activity Diagrams

### 3.1 AD-01 — Faculty Marks-Entry Workflow

```mermaid
flowchart TD
    A([Start]) --> B[Faculty opens assessment marks page]
    B --> C{Entry mode?}
    C -->|Manual grid| D[Enter or edit marks per question]
    C -->|Bulk upload| E[Upload CSV/XLSX template]
    D --> F[Client-side range validation]
    F --> G{All cells valid?}
    G -->|No| H[Highlight invalid cells]
    H --> D
    G -->|Yes| I[PUT marks to API]
    I --> J[Server validates range, enrollment, ownership]
    J --> K{Valid?}
    K -->|No| L[Return 422 with field errors]
    L --> D
    K -->|Yes| M[Upsert marks in transaction]
    M --> N[Write audit summary]
    N --> O[Invalidate attainment cache]
    O --> P[Assessment marked MARKS_COMPLETE]
    P --> Q([End])

    E --> R[Store file and enqueue import job]
    R --> S[Worker parses and validates rows]
    S --> T{Any row errors?}
    T -->|Yes| U[Mark import FAILED and expose row errors]
    U --> V[Faculty corrects file]
    V --> E
    T -->|No| W[Upsert marks transactionally]
    W --> N
```

### 3.2 AD-02 — End-to-End Attainment and Reporting Workflow

```mermaid
flowchart TD
    A([Start]) --> B[Faculty opens course attainment]
    B --> C{COs defined and mapped?}
    C -->|No| D[Prompt to complete CO/CO-PO setup]
    D --> B
    C -->|Yes| E{Question-to-CO tags complete?}
    E -->|No| F[Prompt to tag questions]
    F --> B
    E -->|Yes| G{Marks complete?}
    G -->|No| H[List assessments with missing marks]
    H --> B
    G -->|Yes| I{Approval required and pending?}
    I -->|Yes| J[Wait for HoD approval]
    J --> B
    I -->|No| K[Create snapshot RUNNING and enqueue job]
    K --> L[Worker loads policy and mapping version]
    L --> M[Compute student CO scores]
    M --> N[Compute CO attainment]
    N --> O[Roll up PO attainment by weights]
    O --> P{Calculation successful?}
    P -->|No| Q[Mark snapshot FAILED and keep previous results]
    Q --> R([End with error])
    P -->|Yes| S[Persist CO/PO results and mark COMPLETED]
    S --> T[Invalidate dashboard cache]
    T --> U[Faculty reviews CO/PO dashboard]
    U --> V{Export needed?}
    V -->|No| W([End])
    V -->|Yes| X[Choose format and snapshot]
    X --> Y[Enqueue report job]
    Y --> Z[Worker renders and stores file]
    Z --> AA[Mark report READY]
    AA --> AB[Faculty downloads via signed URL]
    AB --> W
```

### 3.3 AD-03 — CO-PO Mapping Approval Workflow

```mermaid
flowchart TD
    A([Start]) --> B[Faculty opens CO-PO matrix]
    B --> C[Set weights 1 Low / 2 Medium / 3 High]
    C --> D[Save draft]
    D --> E[Validate CO/PO ownership and weight range]
    E --> F{Valid matrix?}
    F -->|No| G[Show inline errors]
    G --> C
    F -->|Yes| H{Approval required?}
    H -->|No| I[Status APPROVED automatically]
    I --> M[Mapping available for attainment]
    H -->|Yes| J[Status PENDING_APPROVAL]
    J --> K[HoD reviews matrix and coverage]
    K --> L{Decision?}
    L -->|Approve| N[Status APPROVED with approver and timestamp]
    N --> M
    L -->|Return for changes| O[Status CHANGES_REQUESTED + comment]
    O --> P[Faculty notified]
    P --> C
    M --> Q([End])
```

## 4. Message and Interaction Design Rules

| Rule | Applies to | Rationale |
|---|---|---|
| All write endpoints validate with the shared Zod schema | SD-02, SD-03 | One contract for frontend and backend; no trust in client input |
| Every query is scoped by JWT claims or RLS | SD-01, SD-06 | Prevents horizontal privilege escalation |
| Synchronous only for small, bounded writes | SD-02, SD-03 manual | Keeps API latency within the 2 s read target |
| Asynchronous for imports, attainment, and reports | SD-03 bulk, SD-04, SD-05 | Work is unbounded and must not block HTTP workers |
| Jobs are idempotent and de-duplicated | SD-04, SD-05 | Retries must not create duplicate snapshots/reports |
| Status resources are pollable | SD-03, SD-04, SD-05 | Simple UI progress without a persistent websocket in v1 |
| Snapshot before compute | SD-04 | Reproducibility and safe rollback |
| Cache invalidation after commit | SD-03, SD-04 | Avoids serving stale attainment as current |
| Audit entry in the same transaction as the change | SD-02, SD-03, SD-04 | No unaudited state change |

### 4.1 Indicative API surface

| Method | Endpoint | Used by |
|---|---|---|
| `POST` | `/api/v1/auth/callback` | SD-01 (session exchange) |
| `GET` | `/api/v1/courses/:id/outcomes` | SD-02 |
| `POST` | `/api/v1/courses/:id/outcomes` | SD-02 |
| `GET` | `/api/v1/assessments/:id/marks-grid` | SD-03 |
| `PUT` | `/api/v1/assessments/:id/marks` | SD-03 manual |
| `POST` | `/api/v1/assessments/:id/imports` | SD-03 bulk |
| `GET` | `/api/v1/imports/:jobId` | SD-03 polling |
| `POST` | `/api/v1/courses/:id/attainment-runs` | SD-04 |
| `GET` | `/api/v1/attainment-runs/:jobId` | SD-04 polling |
| `POST` | `/api/v1/reports` | SD-05 |
| `GET` | `/api/v1/reports/:id` | SD-05 polling |
| `GET` | `/api/v1/me/attainment` | SD-06 |

## 5. Error and Compensation Behaviour

| Failure | Sequence | Behaviour |
|---|---|---|
| JWT expired | SD-01 | `401`; client refreshes once, otherwise redirects to login |
| CO code duplicate | SD-02 | `409`; no partial write |
| Invalid mark | SD-03 | `422`; the whole save is rejected, nothing upserted |
| Import validation failure | SD-03 | Job `FAILED`; no marks committed; row errors downloadable |
| Missing attainment prerequisites | SD-04 | `422`; no snapshot created |
| Worker crash during attainment | SD-04 | Snapshot `FAILED`; previous snapshot remains the active result |
| Report render failure | SD-05 | Report `FAILED`; retryable without changing the snapshot |
| Student accesses another student's row | SD-06 | `403`/empty result; the attempt is audited |

## 6. Traceability

| Scenario | Use case | Domain classes | Key non-functional concern |
|---|---|---|---|
| SD-01 | UC-01 | `User`, `Role` | Security, RBAC |
| SD-02 | UC-05 | `Course`, `CourseOutcome` | Data integrity, auditability |
| SD-03 | UC-11 | `Assessment`, `Question`, `Mark`, `Enrollment` | Performance, validation, atomicity |
| SD-04 | UC-12, UC-13, UC-14 | `AttainmentSnapshot`, `COAttainment`, `POAttainment`, `AttainmentPolicy` | Reproducibility, performance |
| SD-05 | UC-16 | `Report`, `AttainmentSnapshot` | Asynchronous processing, storage |
| SD-06 | UC-19 | `Student`, `Enrollment`, `COAttainment` | Privacy, row-level security |
| AD-01 | UC-11 | `Assessment`, `Mark` | Workflow completeness |
| AD-02 | UC-12, UC-16 | Attainment and report classes | End-to-end consistency |
| AD-03 | UC-07, UC-08 | `COPOMapping` | Governance and separation of duties |

## 7. Assumptions

- v1 uses polling for job status rather than WebSockets; the endpoint contract is designed so a push mechanism can replace polling later.
- The worker and API share the same PostgreSQL database but have separate process lifecycles.
- Attainment runs are per course offering; department-level reporting aggregates completed snapshots rather than recalculating every course.
- A report download never mutates the snapshot; repeated exports of the same snapshot are byte-stable for the same renderer version.
