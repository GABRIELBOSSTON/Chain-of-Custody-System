# Forensic Chain of Custody Management System (FCCMS)

# Entity Relationship Diagram (ERD)

Version : 1.0

---

# Purpose

This document describes the database architecture used in the Forensic Chain of Custody Management System (FCCMS).

It defines:

- Database entities
- Relationships
- Cardinality
- Ownership
- Normalization
- Database rules

This document does not describe individual table columns.

Table columns will be defined during Prisma Schema implementation.

---

# Database Overview

Database Engine

MySQL 8 (XAMPP)

ORM

Prisma ORM

Architecture

Relational Database

Normalization

Third Normal Form (3NF)

Primary Key

UUID

---

# Database Modules

Authentication

- Roles
- Users
- OTP Verification
- MFA Tokens

Case Management

- Cases
- Case Assignments
- Case Status History

Evidence Management

- Evidences
- Evidence Files
- Evidence Hashes
- QR Codes

Chain of Custody

- Custody Events

Security

- Audit Logs
- System Logs

---

# Entity Relationship

## Roles

Relationship

Roles

1

↓

Many

Users

Description

One role can be assigned to many users.

Each user belongs to exactly one role.

---

## Users

Relationship

Users

Many

↓

Many

Cases

Bridge

Case Assignments

Description

A user may work on multiple cases.

A case may contain multiple investigators or detectives.

---

## Cases

Relationship

Case

1

↓

Many

Evidence

Description

One case can contain many evidence items.

Every evidence belongs to exactly one case.

---

## Cases

Relationship

Case

1

↓

Many

Case Status History

Description

Every status transition is permanently stored.

History cannot be deleted.

---

## Evidence

Relationship

Evidence

1

↓

Many

Evidence Files

Description

Evidence may contain multiple photos, videos or laboratory documents.

---

## Evidence

Relationship

Evidence

1

↓

Many

Evidence Hashes

Description

Stores integrity verification history.

SHA-256 generated during creation.

Future algorithms may also be supported.

---

## Evidence

Relationship

Evidence

1

↓

One

QR Code

Description

Each evidence owns exactly one active QR Code.

---

## Evidence

Relationship

Evidence

1

↓

Many

Custody Events

Description

Every custody action creates one custody event.

History is immutable.

---

## Users

Relationship

Users

1

↓

Many

Custody Events

Description

A user may perform many custody operations.

---

## Users

Relationship

Users

1

↓

Many

Audit Logs

Description

Every user activity is recorded.

---

## Users

Relationship

Users

1

↓

Many

System Logs

Description

System logs may optionally reference a user.

---

# Cardinality Summary

Roles

1 → N Users

Users

N → N Cases

Cases

1 → N Evidence

Cases

1 → N Case Status History

Evidence

1 → N Evidence Files

Evidence

1 → N Evidence Hashes

Evidence

1 → 1 QR Code

Evidence

1 → N Custody Events

Users

1 → N Audit Logs

Users

1 → N System Logs

Users

1 → N Custody Events

---

# Ownership

Authentication Module

Owns

Roles

Users

OTP

MFA

Case Module

Owns

Cases

Assignments

Status History

Evidence Module

Owns

Evidence

Files

Hashes

QR

Security Module

Owns

Audit Logs

System Logs

Custody Module

Owns

Custody Events

---

# Database Rules

Audit Logs

Append Only

Update

Not Allowed

Delete

Not Allowed

---

Custody Events

Append Only

Update

Not Allowed

Delete

Not Allowed

---

Evidence

Soft Delete

Allowed

Hard Delete

Restricted

---

Cases

Archive

Read Only

---

Hash Verification

Executed During

- View
- Edit
- QR Scan
- Report

---

# Entity Dependency Order

Roles

↓

Users

↓

Cases

↓

Case Assignments

↓

Case Status History

↓

Evidence

↓

Evidence Files

↓

Evidence Hashes

↓

QR Codes

↓

Custody Events

↓

Audit Logs

↓

System Logs

---

# Planned Database Tables

roles

users

otp_verifications

mfa_tokens

cases

case_assignments

case_status_history

evidences

evidence_files

evidence_hashes

qr_codes

custody_events

audit_logs

system_logs

---

End of Document