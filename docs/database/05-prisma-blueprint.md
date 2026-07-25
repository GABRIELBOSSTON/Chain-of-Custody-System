# Prisma Blueprint

## 1. Purpose

This document serves as the implementation blueprint for the FCCMS database using Prisma ORM.

It defines how the approved database architecture will be translated into the Prisma schema while ensuring that all business rules, relationships, constraints, and naming conventions remain consistent.

This document is an implementation reference only. Any database design changes must first be approved through the Database Architecture and Decision Log documents before being reflected in the Prisma schema.

---

# 2. Objectives

The Prisma Blueprint aims to:

- Translate the approved database architecture into Prisma models.
- Maintain consistency between the ERD and the implementation.
- Standardize model naming, field naming, relationships, indexes, and constraints.
- Prevent implementation decisions from deviating from the approved architecture.

---

# 3. General Rules

The following rules apply to every Prisma model.

## 3.1 Naming Convention

### Model

Use PascalCase.

Example:

- User
- Role
- Case
- Evidence
- Attachment

---

### Field

Use camelCase.

Example:

- createdAt
- updatedAt
- deletedAt
- caseId
- evidenceId

---

### Foreign Key

Foreign key fields always use:

<EntityName>Id

Example:

- roleId
- userId
- caseId
- evidenceId

---

## 3.2 Primary Key

Every table must have a single primary key.

Field name:

id

UUID will be used for all primary keys.

---

## 3.3 Timestamp

Every table must contain:

- createdAt
- updatedAt

Tables supporting soft delete must also contain:

- deletedAt

---

## 3.4 Relationship

Relationships must follow the approved ERD.

No relationship may be added, removed, or modified without updating the Database Architecture document first.

---

## 3.5 Enum

Business values that have fixed options must use Prisma Enum instead of String.

Examples include:

- Role
- Case Status
- Evidence Status
- Custody Action
- Audit Action

---

## 3.6 Soft Delete

Soft delete is implemented using:

deletedAt DateTime?

Records must never be physically deleted unless explicitly allowed by the business rules.

---

## 3.7 Auditability

Business data must preserve historical information.

Operations that require immutable history must use append-only records instead of updating historical entries.

Examples:

- Custody Event
- Audit Log

---

# 4. Model Implementation Order

The Prisma schema should be implemented in the following order:

1. Role
2. User
3. PoliceProfile
4. OTPVerification
5. MFASecret
6. Case
7. CaseAssignment
8. CaseStatusHistory
9. Evidence
10. EvidenceApproval
11. Attachment
12. EvidenceHash
13. QRCode
14. CustodyEvent
15. AuditLog
16. SystemLog
17. Report
18. ReportExport

---

# 5. Implementation Checklist

Before implementation begins, verify that:

- Database Architecture has been approved.
- ERD has been finalized.
- Business Rules have been reviewed.
- Table Specification has been completed.
- Decision Log has no unresolved items.

Only after all requirements above are satisfied may the Prisma schema be implemented.

---

# 6. Notes

This document does not contain Prisma code.

Its purpose is to provide implementation guidance so that every Prisma model follows the approved database design.