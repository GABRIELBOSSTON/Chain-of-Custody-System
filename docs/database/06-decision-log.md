# Database Decision Log

## Purpose

This document records important architectural and database design decisions made during the development of the FCCMS project.

Its purpose is to ensure that every major decision has a clear rationale and can be traced throughout the implementation process.

---

# Decision Rules

Every architectural decision must include:

- Decision ID
- Decision Title
- Status
- Decision
- Reason
- Impact

Possible Status:

- Proposed
- Approved
- Rejected
- Deprecated

---

# Decision List

---

## DB-001

### Title

Case as the Aggregate Root

### Status

Approved

### Decision

The Case entity is the central object of the system.

All Evidence records must belong to a Case.

### Reason

Evidence cannot exist independently.

Every evidence item is collected as part of a criminal case.

### Impact

- Simpler relationship design
- Better data integrity
- Easier authorization

---

## DB-002

### Title

Separate PoliceProfile from User

### Status

Approved

### Decision

Authentication data and police personnel information are stored in different tables.

### Reason

Login information and personnel information have different responsibilities.

### Impact

- Better normalization
- Easier maintenance
- Flexible future expansion

---

## DB-003

### Title

Separate QRCode from Evidence

### Status

Approved

### Decision

QRCode information is stored in its own table.

### Reason

QRCode has its own lifecycle and may require regeneration or replacement without modifying Evidence data.

### Impact

- Cleaner database design
- Better scalability

---

## DB-004

### Title

Attachment as One-to-Many Relationship

### Status

Approved

### Decision

One Evidence may have multiple attachments.

### Reason

Evidence may contain photos, videos, reports, laboratory results, or other supporting files.

### Impact

- Flexible attachment management
- Easier file organization

---

## DB-005

### Title

Custody Event is Append Only

### Status

Approved

### Decision

Custody history must never be updated or deleted.

Every custody transfer creates a new record.

### Reason

Chain of Custody requires a complete historical record.

### Impact

- Immutable history
- Better forensic traceability

---

## DB-006

### Title

Audit Log is Immutable

### Status

Approved

### Decision

Audit records cannot be modified or deleted.

### Reason

Audit logs are legal records used to track system activity.

### Impact

- Better accountability
- Stronger security

---

## DB-007

### Title

UUID as Primary Key

### Status

Approved

### Decision

Every table uses UUID as its primary key.

### Reason

UUID reduces predictability and supports distributed systems.

### Impact

- Better security
- Consistent primary key strategy

---

## DB-008

### Title

Soft Delete Strategy

### Status

Approved

### Decision

Business entities use deletedAt for soft deletion.

### Reason

Deleted records may still be required for audit and historical purposes.

### Impact

- Prevent accidental data loss
- Easier recovery

---

## DB-009

### Title

Table Partitioning for Logs

### Status

Approved

### Decision

The `audit_logs`, `system_logs`, and `custody_events` tables must be partitioned by date (e.g., monthly).

### Reason

These tables are append-only and immutable. Over time, they will grow massively, causing scalability and query performance bottlenecks.

### Impact

- Enhanced query performance on historical data
- Scalable log retention management

---

# Future Decisions

This section will be updated whenever a new database architecture decision is approved.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Initial Version | Initial architectural decisions |