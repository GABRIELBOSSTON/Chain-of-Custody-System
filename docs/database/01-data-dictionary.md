# Forensic Chain of Custody Management System (FCCMS)

# Data Dictionary

Version : 1.1

---

# Purpose

This document defines every data entity used in the Forensic Chain of Custody Management System (FCCMS).

Its purpose is to provide a single source of truth for database design, backend development, frontend integration, and AI-assisted code generation.

Every entity described in this document represents one business object within the system.

This document does NOT define relationships in detail.
Relationships will be explained in the ERD documentation.

---

# Database Standard

Database Engine

- MySQL 8 (XAMPP)

ORM

- Prisma ORM

Naming Convention

- snake_case

Primary Key

- UUID

Foreign Key

- table_name_id

Timestamp

- created_at
- updated_at

Soft Delete

- deleted_at
- deleted_by

Character Encoding

- utf8mb4

Timezone

- UTC

---

# System Modules

The system is divided into several business modules.

1. Authentication
2. User Management
3. Case Management
4. Evidence Management
5. QR Code Management
6. Chain of Custody
7. Audit Logging
8. Reporting
9. System Monitoring

---

# Entity List

The database consists of eighteen core entities.

---

## 1. Roles

Purpose

Stores every role available inside the application.

Examples

- Superadmin
- Investigator
- Detective

Main Responsibilities

- Determines system access level.
- Used by RBAC.
- Referenced by users.

---

## 2. Users

Purpose

Stores every registered user's authentication and account status.

Examples

- Investigator
- Detective
- Superadmin

Main Responsibilities

- Login
- MFA Authentication
- Case Assignment
- Evidence Operations
- QR Operations

Notes

Every user must belong to exactly one role.

Passwords are never stored as plaintext.

---

## 3. Police Profiles

Purpose

Stores official personnel information for verified police officers.

Main Responsibilities

- Police Identification
- Personnel metadata (Full Name, Phone)
- Separation of concerns from authentication (DB-002)

Notes

Linked 1:1 with Users.

---

## 4. OTP Verifications

Purpose

Stores one-time password verification during account activation.

Main Responsibilities

- Verify new account
- Expiration control
- Prevent duplicate activation

Notes

OTP is used only during registration.

Login authentication uses MFA.

---

## 5. MFA Secrets

Purpose

Stores Multi-Factor Authentication configuration.

Main Responsibilities

- Secret key
- Recovery status
- MFA validation

Notes

Every login requires MFA.

---

## 6. Cases

Purpose

Stores criminal investigation cases.

Examples

Case A

Case B

Cyber Crime Investigation

Main Responsibilities

- Case Information
- Case Status
- Evidence Ownership
- Personnel Assignment

---

## 7. Case Assignments

Purpose

Stores user assignments to cases.

Main Responsibilities

- Investigator Assignment
- Detective Assignment
- Permission Scope

Notes

One case can have multiple assigned users.

One user can participate in multiple cases.

---

## 8. Case Status History

Purpose

Stores every status transition of a case.

Example

Open

↓

Under Investigation

↓

Pending Review

↓

Submitted to Prosecution

↓

In Court

↓

Archived

Main Responsibilities

- Timeline
- History
- Audit

Notes

Case status history must never be deleted.

---

## 9. Evidences

Purpose

Stores every physical or digital evidence.

Examples

Laptop

Knife

USB Drive

Firearm

Document

Mobile Phone

Main Responsibilities

- Evidence Registration
- Evidence Metadata
- Current Custodian
- Current Location

Notes

Sensitive information is encrypted before being stored.

---

## 10. Evidence Approvals

Purpose

Stores requests and approval states for evidence modification.

Main Responsibilities

- Edit Approvals
- Soft Delete Approvals
- Detective Supervision

Notes

Ensures evidence integrity through supervisory authorization.

---

## 11. Attachments

Purpose

Stores files related to evidence.

Examples

Evidence Photos

PDF

Laboratory Result

Video

Audio Recording

Main Responsibilities

- File Reference
- File Type
- Storage Location

Notes

Files are stored locally inside the uploads directory.

Database stores only file metadata and file path.

---

## 12. Evidence Hashes

Purpose

Stores cryptographic hashes for evidence integrity verification.

Main Responsibilities

- SHA-256 Storage
- Integrity Verification
- Hash History

Notes

Hash is generated during evidence creation.

Hash is verified during:

- View
- Edit
- QR Scan
- Report Generation

---

## 13. QR Codes

Purpose

Stores encrypted QR information.

Main Responsibilities

- QR Generation
- QR Validation
- QR Status

Notes

QR contents are encrypted using AES-256.

QR can only be interpreted by the application.

---

## 14. Custody Events

Purpose

Stores every transfer of evidence ownership.

Examples

Create

View

Transfer

Receive

Check

Verification

Main Responsibilities

- Chain of Custody
- Custodian History
- Transfer Timeline

Notes

This is the most important business entity in the system.

Custody events are immutable.

---

## 15. Audit Logs

Purpose

Stores every system activity.

Examples

Login

Logout

Create Evidence

Update Evidence

Generate Report

View QR

Permission Denied

Main Responsibilities

- Security
- Compliance
- Investigation

Notes

Audit logs are append-only.

Update and Delete operations are prohibited.

---

## 16. System Logs

Purpose

Stores internal application events.

Examples

OTP Failed

Hash Verification Failed

Database Error

Unauthorized Access

Timer Expired

Main Responsibilities

- Debugging
- Monitoring
- Troubleshooting

Notes

System logs are different from audit logs.

Audit logs record user actions.

System logs record application events.

---

## 17. Reports

Purpose

Stores generated investigation reports.

Main Responsibilities

- Report Metadata
- Report Generation History
- Export Tracking

Notes

Report generation always performs hash verification before export.

---

## 18. Report Exports

Purpose

Stores every exported report.

Main Responsibilities

- Export History
- Export Type
- Download Tracking

Notes

Every exported report must be recorded inside the audit log.

---

# Entity Ownership

Authentication Module

- Roles
- Users
- Police Profiles
- OTP Verifications
- MFA Secrets

Case Management

- Cases
- Case Assignments
- Case Status History

Evidence Management

- Evidences
- Evidence Approvals
- Attachments
- Evidence Hashes
- QR Codes

Chain of Custody

- Custody Events

Security

- Audit Logs
- System Logs

Reporting

- Reports
- Report Exports

---

# Out of Scope

This document does not describe

- Table columns
- Foreign Keys
- Indexes
- Constraints
- API
- Database relationships

Those topics will be covered in subsequent documents.

---

End of Document