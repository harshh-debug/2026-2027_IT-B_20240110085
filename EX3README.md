# OBE Management System

A web-based platform that helps educational institutions define, track, and evaluate student learning outcomes — measuring whether students are actually achieving the expected **Course Outcomes (COs)** and **Program Outcomes (POs)** defined for their courses and degree programs, rather than focusing only on marks and grades.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Version Roadmap](#version-roadmap)
- [Architecture (v3 — Final Production)](#architecture-v3--final-production)
- [Component Breakdown](#component-breakdown)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Environments & Configuration](#environments--configuration)
- [Security, Observability, CI/CD & Backups](#security-observability-cicd--backups)
- [Basic Workflow](#basic-workflow)
- [Example](#example)
- [Main Features](#main-features)
- [Project Goal](#project-goal)

## Overview

In an Outcome-Based Education model, faculty members need to:

- Define Course Outcomes for each subject
- Map Course Outcomes to Program Outcomes
- Map assessment questions to relevant Course Outcomes
- Record student performance
- Calculate attainment levels
- Analyze weak and strong learning outcomes
- Generate reports for academic evaluation and accreditation

Managing this manually with spreadsheets is difficult, repetitive, and error-prone. This project automates and centralizes that process.

## Problem Statement

See [Overview](#overview) above — the core pain point is the manual, spreadsheet-driven CO/PO tracking process used for academic evaluation and accreditation.

## Version Roadmap

| Version | Scope | Status |
|---|---|---|
| v1 | IT department only, runs locally, launched within 20 days | In progress |
| v2 | College-wide multi-department deployment, cloud hosting, report polish | Planned |
| v3 (Final Production) | Production-grade, multi-tenant, high availability, monitoring, CI/CD, audit trail | Target |

## Architecture (v3 — Final Production)

```
  Users  (Admin / HoD / Faculty)
             |  HTTPS
             v
 -------------------------------
|        Next.js Frontend       |  Vercel Edge Network / Docker + Nginx
|  UI, SSR, middleware auth     |  SSG/SSR, TanStack Query, Recharts
 -------------+-----------------
              |  HTTPS (REST /api/v1)
              v
 -------------------------------
|       Express REST API        |  TypeScript, Docker, scaled >= 2
|  modular services, Zod guard  |  Railway / AWS ECS / bare-metal
 ---+------+------+------+------
    |      |      |      |
    v      v      v      v
 --------  ------  ------  -----------
|PostgreSQL||Redis ||Auth  ||  Storage  |
|(Supabase)||queue ||JWT   ||Excel/PDF  |
|RLS, PITR ||cache ||RBAC  ||reports    |
 --------  ------  ------  -----------
    |
    v
 -----------------------
|  Worker (BullMQ)      |  Async jobs: Excel import,
|  Node + Redis         |  report generation, exports
 -----------------------
```

## Component Breakdown

- **Frontend** — Next.js with Server Components for fast page loads and client components for interactive editors (CO-PO matrix, marks entry). State and server cache managed with TanStack Query; charts rendered with Recharts.
- **Backend** — Modular Express API versioned under `/api/v1`. Each domain (programs, courses, assessments, attainment, reports) is a separate router + service. All inputs are validated with Zod before reaching the database.
- **Database** — PostgreSQL 16 hosted on Supabase. Multi-tenant by college → department → program with Postgres Row-Level Security (RLS) enforced at the database level. Managed point-in-time backups and connection pooling via Supavisor.
- **Authentication** — Supabase Auth issues short-lived JWTs. Roles (Admin / HoD / Faculty) are stored as custom claims and enforced by API middleware plus RLS.
- **Storage** — Supabase Storage holds uploaded Excel/CSV files and generated report files (Excel/PDF), served behind signed URLs.
- **Workers & Queue** — Heavy tasks (bulk Excel imports, report generation) run as BullMQ jobs on a dedicated worker using Redis as the broker, keeping the API responsive.
- **Caching** — Redis (Upstash or self-hosted) caches frequently read data (CO-PO matrices, attainment dashboards) to cut database load.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router) | React framework, SSR/SSG, routing |
| Language | TypeScript | Typed frontend and backend |
| UI | Tailwind CSS, shadcn/ui | Styling and accessible components |
| Client data | TanStack Query | Server state, caching, mutations |
| Charts | Recharts | Attainment dashboards and analytics |
| Backend | Node.js, Express | REST API under `/api/v1` |
| Validation | Zod | Shared request/response schemas |
| API security | Helmet, express-rate-limit | Secure headers and rate limiting |
| Database | PostgreSQL 16 (Supabase) | Primary data store |
| ORM | Prisma | Typed queries and migrations |
| Auth | Supabase Auth | JWT authentication and RBAC |
| Storage | Supabase Storage | Excel imports and report files |
| Queue | BullMQ + Redis | Async import and report jobs |
| Excel | SheetJS, ExcelJS | Import (CSV/XLSX), styled export |
| Testing | Vitest | Unit tests (attainment engine) |
| Lint / Format | ESLint, Prettier | Code quality |
| CI/CD | GitHub Actions, Docker | Build, test, and auto-deploy |
| Deployment | Vercel (web), Railway/AWS ECS (API) | Production hosting |
| Observability | Sentry, Pino | Error tracking, structured logs |

## Monorepo Structure

```
obe-system/
|-- apps/
|   |-- web/                  # Next.js frontend
|   `-- api/                  # Express backend (REST /api/v1)
|-- packages/
|   `-- shared/               # Zod schemas + shared TypeScript types
|-- workers/                  # BullMQ workers (Excel import, reports)
|-- prisma/                   # Database schema + migrations
|-- scripts/                  # Seed scripts + Excel import templates
`-- infra/                    # Dockerfiles, nginx config, CI workflows
```

## Environments & Configuration

| Environment | Purpose | Notes |
|---|---|---|
| Local | Development on laptops | Dockerized API + Next.js, Supabase local stack or shared dev project |
| Staging | Pre-production testing | Mirrors production, separate Supabase project |
| Production | Live deployment | Supabase project with PITR, scaled API replicas, CDN frontend |

### Environment Variables

```
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
REDIS_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SENTRY_DSN
```

## Security, Observability, CI/CD & Backups

- **Security** — HTTPS everywhere, short-lived JWTs, RBAC enforced at API and database level, Zod validation on every request, Helmet + rate limiting, secrets stored in environment variables / cloud vaults, full audit log of all data changes.
- **Observability** — Structured logging with Pino, error tracking with Sentry, and API/dashboard metrics collected in dev, staging, and production.
- **CI/CD** — GitHub Actions runs lint, typecheck, unit tests, and build on every push; on merge to `main` it runs Prisma migrations and auto-deploys the web app and API.
- **Backups** — Supabase managed point-in-time recovery for PostgreSQL, plus scheduled `pg_dump` snapshots pushed to object storage; report files and uploads versioned in Supabase Storage.

## Basic Workflow

```
Faculty defines Course Outcomes
        |
Creates assessments
        |
Maps questions to Course Outcomes
        |
Student marks are recorded
        |
System calculates CO attainment
        |
COs are mapped to Program Outcomes
        |
PO attainment is calculated
        |
Reports and analytics are generated
```

## Example

For a Database Management Systems course:

- CO1: Understand database concepts
- CO2: Write SQL queries
- CO3: Design normalized database schemas
- CO4: Understand transactions and concurrency

Assessment questions mapped to these outcomes:

| Assessment Item | Mapped CO(s) |
|---|---|
| Question 1 | CO1 |
| Question 2 | CO2 |
| Assignment | CO3 |
| Lab Exam | CO2 + CO3 |

Based on student marks, the system calculates results such as:

| Outcome | Attainment |
|---|---|
| CO1 | 82% |
| CO2 | 74% |
| CO3 | 68% |
| CO4 | 79% |

This allows faculty members to identify areas where students are performing well and where additional improvement is required.

## Main Features

- Student and faculty management
- Course and program management
- Course Outcome creation
- Program Outcome creation
- CO-PO mapping
- Assessment management
- Question-to-CO mapping
- Student marks management
- Automated attainment calculation
- Department and course-level analytics
- Attainment reports
- Role-based access for administrators and faculty

## Project Goal

To provide a centralized and automated system for managing the complete Outcome-Based Education process, reducing manual effort and providing better visibility into student learning performance.
