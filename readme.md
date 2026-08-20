# Outcome-Based Education (OBE) Management System

## Project Overview

The **Outcome-Based Education (OBE) Management System** is a web-based platform designed to help educational institutions define, track, and evaluate student learning outcomes.

Instead of focusing only on marks and grades, the system measures whether students are actually achieving the expected **Course Outcomes (COs)** and **Program Outcomes (POs)** defined for their courses and degree program.

## Problem Statement

In an Outcome-Based Education model, faculty members need to:

* Define Course Outcomes for each subject
* Map Course Outcomes to Program Outcomes
* Map assessment questions to relevant Course Outcomes
* Record student performance
* Calculate attainment levels
* Analyze weak and strong learning outcomes
* Generate reports for academic evaluation and accreditation

Managing this manually using spreadsheets can become difficult, repetitive, and error-prone.

This project aims to automate and centralize that process.

## Basic Workflow

```text
Faculty defines Course Outcomes
        ↓
Creates assessments
        ↓
Maps questions to Course Outcomes
        ↓
Student marks are recorded
        ↓
System calculates CO attainment
        ↓
COs are mapped to Program Outcomes
        ↓
PO attainment is calculated
        ↓
Reports and analytics are generated
```

## Example

For a Database Management Systems course:

```text
CO1: Understand database concepts
CO2: Write SQL queries
CO3: Design normalized database schemas
CO4: Understand transactions and concurrency
```

Assessment questions can then be mapped to these outcomes.

```text
Question 1 → CO1
Question 2 → CO2
Assignment → CO3
Lab Exam → CO2 + CO3
```

Based on student marks, the system can calculate results such as:

```text
CO1 Attainment: 82%
CO2 Attainment: 74%
CO3 Attainment: 68%
CO4 Attainment: 79%
```

This allows faculty members to identify areas where students are performing well and where additional improvement is required.

## Main Features

* Student and faculty management
* Course and program management
* Course Outcome creation
* Program Outcome creation
* CO-PO mapping
* Assessment management
* Question-to-CO mapping
* Student marks management
* Automated attainment calculation
* Department and course-level analytics
* Attainment reports
* Role-based access for administrators and faculty

## Project Goal

The main goal of the project is to provide a centralized and automated system for managing the complete Outcome-Based Education process, reducing manual effort and providing better visibility into student learning performance.
