# Outcome-Based Education (OBE) Management System

Software Requirements Specification — Version 1.0 (Draft)
Date: September 15, 2026

## Overview

The OBE Management System is a web-based platform that helps educational institutions define, track, and evaluate student learning outcomes. Rather than relying on marks and grades alone, it measures whether students are achieving the Course Outcomes (COs) and Program Outcomes (POs) defined for their courses and degree programs — replacing the manual, spreadsheet-based process most institutions currently use.

The product is planned across three releases:

| Version | Scope |
|---|---|
| **v1** | Single IT department, local deployment (this SRS's primary focus) |
| **v2** | College-wide, cloud-hosted deployment |
| **v3** | Production-grade, multi-tenant deployment with monitoring, CI/CD, and an audit trail |

## Core Features

- **CO/PO Management** — Create, edit, and organize Course Outcomes and Program Outcomes
- **CO-PO Mapping** — Interactive matrix editor linking Course Outcomes to Program Outcomes with mapping strengths
- **Assessment & Question Mapping** — Create assessments (assignments, quizzes, exams) and map questions to COs
- **Student Marks Management** — Marks-entry grid with bulk Excel/CSV import
- **Automated Attainment Calculation** — Auto-computes CO attainment from marks, then rolls up to PO attainment
- **Analytics & Reporting** — Department/course-level dashboards with Excel/PDF export
- **Role-Based Access Control** — Admin, Head of Department (HoD), and Faculty roles

## User Roles

| Role | Description |
|---|---|
| **Administrator** | Full system access; manages users, programs, courses, and configuration |
| **Head of Department (HoD)** | Oversees CO-PO mapping and attainment results; reviews/approves reports |
| **Faculty** | Defines COs, creates assessments, maps questions, enters marks (highest-frequency user) |

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Node.js / Express REST API, versioned under `/api/v1`, validated with Zod (schemas shared with frontend)
- **Database:** PostgreSQL 16 (via Prisma ORM), Row-Level Security for multi-tenant isolation (v2+)
- **Auth:** Supabase Auth issuing short-lived JWTs with role claims
- **Caching / Jobs:** Redis + BullMQ for background jobs (bulk import, report generation)
- **Storage:** Supabase Storage for uploaded/generated files
- **Monitoring:** Sentry (errors), Pino (structured logging)
- **Import/Export:** SheetJS / ExcelJS

## Architecture

Codebase is organized as a monorepo:

```
apps/web        → Next.js frontend
apps/api        → Express REST API
packages/shared → Shared types & Zod validation schemas
workers/        → BullMQ background workers
prisma/         → Database schema & migrations
scripts/        → Utility scripts
infra/          → Deployment/infrastructure config
```

**Workflow:** Faculty defines Course Outcomes → creates assessments → maps questions to COs → student marks are recorded → system calculates CO attainment → COs are mapped to Program Outcomes → PO attainment is calculated → reports and analytics are generated.

## Non-Functional Highlights

- Standard read requests respond within 2 seconds under normal load (v1)
- Course-level attainment recalculation completes within 5 seconds; bulk operations run asynchronously
- All traffic over HTTPS; JWT-based auth; RBAC enforced at API layer (and DB RLS from v2+)
- Inputs validated via shared Zod schemas; secure headers (Helmet) and rate limiting
- Full audit trail of data-changing operations starting v3

## Deployment Environments

| Environment | Purpose |
|---|---|
| Local | Dockerized API + Next.js, Supabase local stack |
| Staging | Mirrors production, separate Supabase project |
| Production | Supabase with PITR, scaled API replicas, CDN-served frontend |

CI/CD via GitHub Actions: lint, type-check, unit tests, and build on every push; migrations + deployment on merge to `main`.

## Glossary

| Term | Meaning |
|---|---|
| OBE | Outcome-Based Education |
| CO | Course Outcome |
| PO | Program Outcome |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| RLS | Row-Level Security |
| PITR | Point-In-Time Recovery |
| HoD | Head of Department |

## Open Items (TBD)

- Attainment threshold/target score methodology
- Accreditation report format(s) to support (e.g., NBA, ABET) for v2/v3
- Multi-tenant onboarding process for v2
- Audit log data retention period

## References

- OBE Management System design report (System Design and Architecture)
- IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications
- SRS template basis: Karl E. Wiegers

---
*This README is a summary derived from the full Software Requirements Specification (SRS) document. Refer to the SRS for complete functional requirements (REQ-\* tags), detailed stimulus/response sequences, and appendix analysis models.*
