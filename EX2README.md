# Outcome-Based Education (OBE) Management System

A centralized, web-based platform that automates Course Outcome (CO) / Program Outcome (PO) definition, mapping, attainment calculation, and reporting for higher education institutions — replacing error-prone, manual spreadsheet-based OBE tracking.

## Domain

Higher Education / Academic Assessment and Accreditation

## Problem Statement

In an Outcome-Based Education model, faculty must define Course Outcomes, map them to Program Outcomes, map assessment questions to relevant COs, record student performance, calculate attainment levels, analyze weak and strong learning outcomes, and generate reports for academic evaluation and accreditation. Doing this manually via spreadsheets is difficult, repetitive, and error-prone as the number of courses, outcomes, and students grows.

This project addresses that problem with a centralized platform that automates CO/PO definition, mapping, attainment calculation, and reporting — letting institutions measure whether students are actually achieving expected learning outcomes, rather than relying on marks and grades alone.

## Objectives

- Provide a centralized platform to define COs and POs for each course and program.
- Enable CO-PO mapping and question-to-CO mapping for assessments.
- Record student assessment performance and automatically calculate CO/PO attainment levels.
- Provide department- and course-level analytics to identify weak and strong learning outcomes.
- Generate attainment reports suitable for academic evaluation and accreditation.
- Reduce manual effort and error rate in spreadsheet-based OBE tracking.
- Enforce role-based access control for Admins, Heads of Department (HoD), and Faculty.

## Scope

### In Scope
- Student and faculty management
- Course and program management, including CO/PO creation
- CO-PO mapping and question-to-CO mapping for assessments
- Assessment management and student marks entry
- Automated CO/PO attainment calculation
- Department- and course-level analytics and dashboards
- Attainment report generation and exports (Excel/PDF)
- Role-based access for Admin, HoD, and Faculty
- Phased rollout: v1 (single department, local) → v2 (college-wide, cloud) → v3 (multi-tenant production with monitoring, CI/CD, audit trail)

### Out of Scope
- Student admission, fee management, and other non-academic administrative modules
- Learning management functions (content delivery, online examinations)
- Payroll, HR, or finance-related institutional systems

## Architecture

A layered web architecture:

- **Frontend:** Next.js (Server Components for pages, client components for interactive editors like the CO-PO matrix and marks entry)
- **API:** Modular Express REST API, versioned under `/api/v1`, with request validation via Zod
- **Database:** PostgreSQL 16 on Supabase, with multi-tenancy enforced via Row-Level Security (college / department / program)
- **Auth:** Supabase Auth issuing short-lived JWTs; roles (Admin/HoD/Faculty) enforced via custom claims, API middleware, and RLS
- **Background jobs:** BullMQ workers backed by Redis for heavy operations (bulk Excel imports, report generation)
- **Caching:** Redis caches frequently read data (CO-PO matrices, attainment dashboards)

### Tech Stack
Next.js · TypeScript · Node.js/Express · PostgreSQL (Supabase) · Prisma · Zod · Redis · BullMQ · Tailwind CSS · shadcn/ui · GitHub Actions (CI/CD) · Vitest · Pino (logging) · Sentry (error tracking)

### Deployment
- Frontend: Vercel
- API: Railway / AWS ECS
- Database: Supabase

## Roadmap

| Version | Scope | Status |
|---|---|---|
| v1 | IT department only, runs locally, launched within 20 days | In progress |
| v2 | College-wide multi-department deployment, cloud hosting, report polish | Planned |
| v3 (Final Production) | Production-grade, multi-tenant, high availability, monitoring, CI/CD, audit trail | Target |

## Feasibility Summary

**Technical:** Feasible across technology, hardware, software tools, security, and scalability — the stack is mature, cloud-hosted (no dedicated on-premise hardware needed), and the modular/versioned API architecture allows scaling from single-department v1 to multi-tenant v3 without redesign.

**Operational:** High across user acceptance, ease of use, availability, maintainability, and business benefit — the digital workflow mirrors the manual process faculty already follow, is cloud-available, and is maintained via a monorepo with CI/CD, typed schemas, and automated tests.

**Conclusion:** The OBE Management System is both technically and operationally viable, with no significant barriers identified to development. It is ready to proceed to the requirement analysis and design phases.

## Project Structure (Planned)

```
obe-management-system/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/           # Express REST API (/api/v1)
│   └── workers/       # BullMQ background workers
├── packages/
│   └── shared/        # Shared types, schemas (Zod/Prisma)
└── ...
```

## Roles

- **Admin** — full system and multi-tenant configuration access
- **HoD** — department-level oversight and reporting
- **Faculty** — CO/PO definition, mapping, marks entry, attainment views
