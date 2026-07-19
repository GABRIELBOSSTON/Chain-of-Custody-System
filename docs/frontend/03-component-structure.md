# Forensic Chain of Custody Management System (FCCMS)

# Component Structure

Version : 1.0

---

# Purpose

This document defines the reusable UI components used throughout the Forensic Chain of Custody Management System (FCCMS).

The objective is to maintain a consistent user interface, reduce duplicated code, and simplify frontend development using Next.js and Shadcn UI.

---

# Component Categories

The frontend components are divided into:

1. Layout Components
2. Navigation Components
3. Form Components
4. Data Display Components
5. Feedback Components
6. Dialog Components

---

# Layout Components

## Navbar

Purpose

Display application title, notifications, and user menu.

Used By

- Dashboard
- Cases
- Evidence
- Audit Logs
- Users

---

## Sidebar

Purpose

Display navigation menu based on user role.

Menu items are dynamically shown according to RBAC.

---

## Breadcrumb

Purpose

Display current navigation path.

Example

Dashboard

↓

Cases

↓

Case Detail

---

# Navigation Components

## Page Header

Purpose

Display page title and action buttons.

Example

Evidence List

[ Register Evidence ]

---

## Search Bar

Purpose

Search data.

Used In

- Cases
- Evidence
- Users
- Audit Logs

---

## Filter Panel

Purpose

Filter displayed records.

Example

- Case Status
- Evidence Type
- Date
- Assigned Investigator

---

# Form Components

## Text Input

Examples

- Case Name
- Evidence Name
- Email

---

## Password Input

Used In

- Login
- Change Password

---

## Select Dropdown

Examples

- Role
- Status
- Evidence Category

---

## Date Picker

Examples

- Evidence Collection Date
- Case Date

---

## File Upload

Purpose

Upload evidence files.

Supported

- Image
- PDF
- Video
- Audio

---

## QR Scanner

Purpose

Read encrypted evidence QR codes.

---

# Data Display Components

## Data Table

Used In

- Cases
- Evidence
- Audit Logs
- Users

Features

- Pagination
- Sorting
- Search

---

## Detail Card

Purpose

Display detailed information.

Used In

- Case Detail
- Evidence Detail
- User Detail

---

## Status Badge

Purpose

Display current status.

Examples

- Open
- Archived
- Pending
- Active

---

## Timeline

Purpose

Display Chain of Custody history.

---

# Feedback Components

## Alert

Purpose

Display important information.

Types

- Success
- Warning
- Error
- Info

---

## Loading Spinner

Purpose

Indicate ongoing processes.

Examples

- Login
- Upload
- QR Verification

---

## Empty State

Purpose

Display when no records are available.

---

# Dialog Components

## Confirmation Dialog

Purpose

Confirm important actions.

Examples

- Delete Evidence
- Submit Case
- Logout

---

## Approval Dialog

Purpose

Detective approval before evidence update or deletion.

---

## Success Dialog

Purpose

Inform successful operations.

---

## Error Dialog

Purpose

Display operation failures.

---

# Shared Components

The following components are reused throughout the application.

- Button
- Card
- Badge
- Table
- Input
- Select
- Dialog
- Alert
- Spinner

All shared components use Shadcn UI.

---

# Component Naming Convention

PascalCase

Examples

Navbar

Sidebar

EvidenceTable

CaseCard

UserDialog

AuditTable

---

# Design Principles

- Reusable
- Responsive
- Accessible
- Consistent
- Minimalistic

---

End of Document