# Developer 1 — Frontend & Database (Ikshant Shukla)

## Description

Owner of the **data layer** and the **entire user interface**. Defines how data is stored and how every role (Admin / HoD / Faculty / Student) interacts with the system.

Primary focus: Next.js frontend (per `DESIGN.md`) and the PostgreSQL schema (Prisma + Supabase).

## Responsibilities

**Database**
- Design the Prisma data model (Program, Course, CourseOutcome, ProgramOutcome/PSO, CO-PO mapping, Assessment, Question, Student, Enrollment, MarkEntry, AttainmentTarget).
- Set up the Supabase project, run Prisma migrations, define Postgres Row-Level Security (RLS) policies per role.
- Write seed scripts from the KIET course booklet (11 POs + 2 PSOs, 5th/6th sem courses, COs, CO-PO matrices).
- Provide `packages/shared` types shared with the backend.

**Frontend (Next.js)**
- Implement the design system from `DESIGN.md` (Tailwind theme tokens, EB Garamond 300 + Inter fonts, gradient orbs, pill CTAs).
- Build auth/login pages and role-based route guards (Next.js middleware).
- Build all pages: dashboards, course/CO/PO management, CO-PO matrix editor, assessments, marks grid, attainment charts (Recharts), reports view.
- Wire the frontend to the API using TanStack Query.

## Tech Stack

Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, Prisma, Supabase (Postgres, Auth, Storage).

## Branch

`dev/iks-frontend-db` — created from `main`.

## Deliverables

- `prisma/schema.prisma` + migrations
- Seed script(s) loading real booklet data
- Full frontend matching `DESIGN.md`
- Frontend auth flow + role guards
- Dashboards and charts

## Definition of Done

- App renders all role views from the design system.
- Pages protected by role (verified with an Admin, HoD, Faculty, and Student account).
- Seed data loads for all 5th/6th sem IT courses.

## Integration

Merge into `main` via PR at the end. Coordinate endpoint contracts with Developer 2 (API) and Developer 3 (attainment/imports) before merging.