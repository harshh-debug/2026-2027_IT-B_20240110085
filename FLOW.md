# OBE Management System — User Flow & RBAC

This document explains the complete user flow: authentication, role-based access control (RBAC), and the step-by-step workflow for every role (Admin, HoD, Faculty, Student).

## Roles

| Role | Who | Sees |
| --- | --- | --- |
| **Admin** | System / OBE cell admin | Everything, all departments |
| **HoD** | Head of Department | Their own department only |
| **Faculty** | Teacher | Their own assigned courses only |
| **Student** | Student | Their own marks and attainment only |

## Login Flow (same for all roles)

```text
1. User opens /login → enters email + password
2. Next.js calls Supabase Auth (signInWithPassword)
3. Supabase returns signed JWT + refresh token
4. Session stored in HTTP-only cookie; role read from JWT claim
5. Next.js middleware checks role per route → redirects if not allowed
6. Every API call to Express sends the JWT in the Authorization header
7. Express verifies signature + role, then queries Postgres (RLS filters rows again)
```

Access is enforced at three layers (defense-in-depth):

1. **Next.js middleware** — blocks unauthorized users from even loading a page.
2. **Express API** — every route verifies the JWT and role before executing.
3. **Postgres RLS** — rows are filtered at the database level even on direct access.

## Role-Based Access Control (RBAC)

| Feature | Admin | HoD | Faculty | Student |
| --- | --- | --- | --- | --- |
| Manage users (create/import) | ✓ | ✓ | — | — |
| Manage departments & programs | ✓ | ✓ | — | — |
| Define / seed POs & PSOs | ✓ | — | — | — |
| Set global attainment config | ✓ | — | — | — |
| Manage courses | ✓ | ✓ | own courses | — |
| Assign courses to faculty | ✓ | ✓ | — | — |
| Define Course Outcomes (COs) | ✓ | ✓ | own courses | — |
| CO-PO mapping matrix | ✓ | approve | own courses | — |
| Create assessments & question→CO tags | ✓ | ✓ | own courses | — |
| Enter / import marks | ✓ | ✓ | own courses | — |
| Run attainment calculation | ✓ | ✓ | own courses | — |
| View course reports | ✓ | ✓ | own courses | — |
| View department analytics | ✓ | ✓ | — | — |
| View own marks & attainment | ✓ | ✓ | ✓ | ✓ |
| Export reports (Excel) | ✓ | ✓ | own courses | — |
| Audit log | ✓ | — | — | — |

## Faculty (Teacher) — Core OBE Workflow

1. **Course setup** — open your course (e.g. `CS310L`), define **COs** (CO1–CO5 from the syllabus).
2. **CO-PO mapping** — fill the CO × PO matrix with weights 1 (Low) / 2 (Medium) / 3 (High) using the grid editor; can be imported from the course booklet.
3. **Create assessments** — match the course evaluation scheme, e.g. `MSE 60 + CA 15 + ESE 75`.
4. **Question → CO tagging** — add questions under each assessment and tag each question to a CO.
5. **Marks entry** — record marks per student per question, manually or via Excel/CSV import.
6. **Run attainment** — the engine computes CO attainment (%) and rolls it up to PO attainment.
7. **View report** — per-CO / per-PO percentages, weak vs strong outcomes, export to Excel.

## HoD (Head of Department)

1. Add and assign courses to faculty.
2. Review and approve CO-PO mappings.
3. Monitor department-wide attainment dashboards.
4. Export the department report for accreditation / OBE cell.

## Student

1. Login → dashboard of enrolled courses.
2. View own marks per assessment.
3. View personal CO/PO attainment and which outcomes are weak.
4. (v2+) View announcements and course materials.

## Admin

1. Create departments and programs; seed **11 POs + 2 PSOs** from the course booklet.
2. Create user accounts or bulk-import faculty and students (Excel).
3. Set global attainment configuration (target %, threshold %, CIE:ESE weights).
4. Audit log and system-wide reports.

## End-to-End Data Flow (Attainment Math)

```text
Marks per student
   → grouped by CO (via question→CO tags)
   → CO attainment %  = students scoring ≥ threshold ÷ total
   → weighted CIE + ESE  →  final CO attainment per course
   → PO attainment = Σ(CO% × CO-PO weight) ÷ Σ(weight)
   → Reports: course-level, department rollup, gap analysis
```

All formulas (targets, thresholds, weights) are configurable so they match KIET's autonomous OBE policy.