# Forensic Chain of Custody Management System (FCCMS)

# Business Rules

Version : 1.1

---

# Purpose

This document defines all business rules used in the Forensic Chain of Custody Management System (FCCMS).

Business Rules are mandatory system constraints that must always be enforced by the application.

These rules become the primary reference for:

- Database Design
- Backend Development
- Frontend Validation
- API Development
- AI-Assisted Code Generation

---

# Rule Priority

Critical
- Must never be violated.

High
- Required for correct business process.

Medium
- Required for usability.

Low
- Additional enhancement.

---

# Authentication

---

## BR-001

Priority

Critical

Module

Authentication

Rule

Only Superadmin can create new user accounts.

Reason

To prevent unauthorized account creation.

---

## BR-002

Priority

Critical

Module

Authentication

Rule

Police ID must exist and be valid before account activation.

Reason

Only verified police personnel may access the system.

---

## BR-003

Priority

Critical

Module

Authentication

Rule

Each Police ID must be unique.

---

## BR-004

Priority

Critical

Module

Authentication

Rule

Each email address must be unique.

---

## BR-005

Priority

Critical

Module

Authentication

Rule

Password must be stored using bcrypt.

Passwords must never be stored in plaintext.

---

## BR-006

Priority

Critical

Module

Authentication

Rule

OTP is used only during first account activation.

---

## BR-007

Priority

Critical

Module

Authentication

Rule

Every login requires MFA verification.

---

## BR-008

Priority

High

Module

Authentication

Rule

Only active users may log in.

---

## BR-009

Priority

Critical

Module

Authentication

Rule

RBAC permissions must be checked after successful authentication.

---

# User Management

---

## BR-010

One user has exactly one role.

---

## BR-011

A role can belong to many users.

---

## BR-012

Inactive users cannot access assigned cases.

---

# Case Management

---

## BR-013

Only Investigator and Detective may create cases.

---

## BR-014

Each case must have a unique case number.

---

## BR-015

A case must be assigned before evidence can be registered.

---

## BR-016

A case status must always exist.

---

## BR-017

Case status changes must be recorded permanently.

---

## BR-018

Case status history cannot be deleted.

---

## BR-019

Archived cases become read-only.

---

## BR-020

Evidence cannot be added unless case status is OPEN.

---

# Evidence

---

## BR-021

Each evidence belongs to exactly one case.

---

## BR-022

Evidence UUID is generated automatically.

---

## BR-023

SHA-256 hash must be generated immediately after evidence creation.

---

## BR-024

Sensitive evidence information must be encrypted before storage.

---

## BR-025

Each evidence must have exactly one active QR Code.

---

## BR-026

Attachments must be stored in local storage.

---

## BR-027

Database stores only metadata and file path.

---

## BR-028

Evidence hash must be verified before displaying evidence.

---

## BR-029

Evidence hash must be verified before editing evidence.

---

## BR-030

Evidence hash must be verified before QR operations.

---

## BR-031

Evidence hash must be verified before report generation.

---

## BR-032

Hash verification failure blocks the requested operation.

---

## BR-033

Hash mismatch immediately creates an Audit Log.

---

## BR-034

Hash mismatch immediately notifies Superadmin.

---

# QR Code

---

## BR-035

QR payload must be encrypted using AES-256.

---

## BR-036

QR Code can only be interpreted by FCCMS application.

---

## BR-037

View QR never changes evidence ownership.

---

## BR-038

Every QR scan must create an Audit Log.

---

# Chain of Custody

---

## BR-039

Every custody transfer requires sender confirmation.

---

## BR-040

Every custody transfer requires recipient confirmation.

---

## BR-041

Evidence ownership changes only after recipient confirmation.

---

## BR-042

Current custodian must always match the latest custody event.

---

## BR-043

Current evidence location must always match the latest custody event.

---

## BR-044

Unacknowledged transfers start a three-day timer.

---

## BR-045

Expired transfers become FLAGGED.

---

## BR-046

FLAGGED transfers notify Superadmin.

---

## BR-047

Custody events are immutable.

---

## BR-048

Custody events cannot be updated.

---

## BR-049

Custody events cannot be deleted.

---

# Approval

---

## BR-050

Evidence edit requires Detective approval.

---

## BR-051

Evidence soft delete requires Detective approval.

---

## BR-052

Hard delete is allowed only if custody history does not exist.

---

## BR-053

Hard delete can only be executed by Superadmin.

---

# Audit

---

## BR-054

Every business action must create an Audit Log.

---

## BR-055

Audit Log is append-only.

---

## BR-056

Audit Log cannot be updated.

---

## BR-057

Audit Log cannot be deleted.

---

## BR-058

Audit Log stores timestamp, actor, action and affected entity.

---

# Reporting

---

## BR-059

Report generation requires successful hash verification.

---

## BR-060

Only authorized users may generate reports.

---

## BR-061

Report generation must be recorded in Audit Log.

---

# Security

---

## BR-062

Users may only access assigned cases.

---

## BR-063

Detectives cannot access cases outside their assignments.

---

## BR-064

Unauthorized access attempts must be logged.

---

## BR-065

Session expiration requires user login again with MFA.

---

# System

---

## BR-066

System errors must be recorded in System Log.

---

## BR-067

Security events must be recorded in System Log.

---

## BR-068

Database timestamps use UTC.

---

## BR-069

UUID must be generated by the application.

---

## BR-070

Application never performs UPDATE or DELETE on Audit Logs or Custody Events.

---

End of Document