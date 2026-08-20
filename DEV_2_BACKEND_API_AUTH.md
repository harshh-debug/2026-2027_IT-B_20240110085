# Developer 2 — Backend API & Auth (DEV-2)

## Description

Owner of the **Express REST API** and **authentication / RBAC**. Exposes every operation as a versioned endpoint (`/api/v1`) and enforces role-based access on the server.

Primary focus: Express backend, Supabase Auth integration, JWT verification, and all domain CRUD endpoints except marks/attainment (owned by Developer 3).

## Responsibilities

**API & Architecture**
- Scaffold the Express + TypeScript app, modular routers under `/api/v1`.
- Implement centralized error handling, request logging (Pino), Helmet, CORS, and rate limiting.
- Integrate the Prisma client and consume `packages/shared` Zod schemas for validation.
- Write endpoint contracts / Postman collection for the frontend team.

**Auth & RBAC**
- Supabase Auth integration: `signInWithPassword`, refresh tokens, JWT verification middleware.
- Role claims (Admin / HoD / Faculty / Student) parsed from the JWT and enforced per route.
- Role-scoped queries so Faculty only access their own courses and HoD only their department.

**Domain CRUD Endpoints**
- Programs, Courses, Course Outcomes, Program Outcomes / PSOs, CO-PO mapping matrix.
- Course assignment to faculty (for HoD).

## Tech Stack

Node.js, Express, TypeScript, Zod, Prisma, Supabase Auth, Helmet, Pino.

## Branch

`dev/backend-api-auth` — created from `main`.

## Deliverables

- Express app with versioned routers
- JWT auth middleware + RBAC per route
- CRUD endpoints for all domain entities
- API contract docs / Postman collection
- Dockerfile for the API

## Definition of Done

- Every endpoint verifies JWT + role (tested with Admin / HoD / Faculty / Student tokens).
- All inputs validated by shared Zod schemas.
- Postman collection covers all endpoints.

## Integration

Merge into `main` via PR at the end. Share the endpoint contracts with Developer 1 (frontend) and agree on response shapes for marks/attainment endpoints with Developer 3.