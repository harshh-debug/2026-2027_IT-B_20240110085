# Developer 3 — Attainment, Imports & Reports (DEV-3)

## Description

Owner of **assessments, marks, the attainment engine, and reporting**. Handles every data-in/data-out path: Excel/CSV import, attainment calculation, and Excel/PDF-style report export.

Primary focus: the core OBE math (CO → PO attainment) plus everything marks-related.

## Responsibilities

**Assessments & Marks**
- Assessment, Question, and Question→CO mapping endpoints.
- Mark entry endpoints (per student per question).
- **Excel/CSV import** (SheetJS) for students, COs, and marks; provide downloadable import templates.

**Attainment Engine**
- CO attainment % = students scoring ≥ threshold ÷ total, weighted across CIE (MSE + CA) and ESE.
- PO attainment = Σ(CO% × CO-PO weight) ÷ Σ(weight).
- Make targets, thresholds, and weights configurable per course / globally.
- Unit tests with Vitest validating against a sample OBE worksheet.

**Reports & Export**
- Per-course CO/PO attainment report, department rollup, low-attainment gap analysis.
- Styled Excel export (ExcelJS).
- BullMQ workers (Redis) for heavy imports and report generation to keep the API fast.

## Tech Stack

Node.js, Express, TypeScript, SheetJS, ExcelJS, BullMQ, Redis, Vitest.

## Branch

`dev/attainment-reports` — created from `main`.

## Deliverables

- Assessment / question / marks endpoints
- Excel/CSV import + templates
- Attainment engine + Vitest unit tests
- Report endpoints + Excel export
- BullMQ worker(s)

## Definition of Done

- Import a sample marks Excel and produce correct CO/PO attainment (validated against the worksheet).
- Engine passes unit tests.
- Reports export as styled Excel files.

## Integration

Merge into `main` via PR at the end. Coordinate the marks/attainment endpoint shapes with Developer 2 (API) and the report UI with Developer 1 (frontend).