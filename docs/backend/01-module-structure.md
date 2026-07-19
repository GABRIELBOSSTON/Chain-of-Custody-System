# Forensic Chain of Custody Management System (FCCMS)

# Backend Module Structure

Version : 1.0

---

# Purpose

This document describes the backend module architecture of the Forensic Chain of Custody Management System (FCCMS).

The system follows a modular architecture using NestJS.

Each module is responsible for a single business domain to improve maintainability, scalability, and separation of concerns.

---

# Architecture

Framework

- NestJS

Language

- TypeScript

Architecture Style

- Modular Monolith

Database

- MySQL 8

ORM

- Prisma ORM

Authentication

- JWT
- MFA
- OTP

---

# Backend Modules

The backend consists of the following modules.

---

## 1. Auth Module

Purpose

Handles authentication and authorization.

Responsibilities

- Login
- Logout
- JWT Authentication
- MFA Verification
- OTP Verification
- Refresh Token
- Password Validation

Database Tables

- users
- otp_verifications
- mfa_tokens

---

## 2. User Module

Purpose

Manages user accounts.

Responsibilities

- Create User
- Update User
- View User
- Soft Delete User
- Profile Management

Database Tables

- users
- roles

---

## 3. Role Module

Purpose

Manages user roles.

Responsibilities

- View Roles
- Assign Role
- Validate RBAC

Database Tables

- roles

---

## 4. Case Module

Purpose

Manages investigation cases.

Responsibilities

- Create Case
- Update Case
- Archive Case
- Change Status
- Assign Personnel

Database Tables

- cases
- case_assignments
- case_status_history

---

## 5. Evidence Module

Purpose

Manages evidence records.

Responsibilities

- Register Evidence
- Update Evidence
- Generate SHA-256
- Verify Integrity
- Generate QR Code
- Upload Evidence Files

Database Tables

- evidences
- evidence_files
- evidence_hashes
- qr_codes

---

## 6. Custody Module

Purpose

Manages Chain of Custody.

Responsibilities

- Evidence Handover
- Custody Confirmation
- Custody History
- Current Custodian
- Current Location

Database Tables

- custody_events

---

## 7. Audit Module

Purpose

Stores all user activities.

Responsibilities

- Create Audit Log
- Search Audit Log
- Export Audit Log

Database Tables

- audit_logs

---

## 8. System Log Module

Purpose

Stores application events.

Responsibilities

- Error Logging
- Exception Logging
- Security Events
- Warning Logs

Database Tables

- system_logs

---

## 9. QR Module

Purpose

Handles encrypted QR operations.

Responsibilities

- Generate QR
- Decode QR
- Validate QR
- QR View
- QR Handover

Database Tables

- qr_codes

---

# Module Dependency

Auth

↓

User

↓

Case

↓

Evidence

↓

Custody

↓

Audit

System Log

QR

---

# Dependency Rules

- Modules communicate through Services.
- Controllers must never access the database directly.
- Prisma is accessed only from the Service layer.
- Business logic must not be placed inside Controllers.
- Controllers handle only HTTP requests and responses.

---

# Standard Module Structure

Each module follows the same folder structure.

auth/

- auth.controller.ts
- auth.service.ts
- auth.module.ts
- dto/
- guards/
- strategies/

The same structure applies to all business modules.

---

# Shared Components

Common components shared across modules include:

- Prisma Service
- JWT Guard
- Role Guard
- Auth Guard
- Exception Filter
- Validation Pipe
- Logger Service
- Config Service

---

# Design Principles

The backend follows these principles:

- Single Responsibility Principle (SRP)
- Separation of Concerns (SoC)
- Dependency Injection
- Modular Design
- RESTful API
- RBAC Authorization
- Secure by Default

---

End of Document