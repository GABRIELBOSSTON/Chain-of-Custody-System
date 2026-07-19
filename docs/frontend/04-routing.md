# Forensic Chain of Custody Management System (FCCMS)

# Frontend Routing

Version : 1.0

---

# Purpose

This document defines the routing structure for the Forensic Chain of Custody Management System (FCCMS).

The application uses Next.js App Router.

Routes are grouped into Authentication and Dashboard sections.

All protected routes require authentication.

---

# Route Groups

The application consists of two route groups:

- Authentication
- Dashboard

---

# Authentication Routes

## Login

Route

/login

Access

Public

Purpose

Authenticate users using email and password.

---

## OTP Verification

Route

/auth/otp

Access

Public

Purpose

Activate newly created accounts.

---

## MFA Verification

Route

/auth/mfa

Access

Temporary Authenticated Session

Purpose

Verify MFA code before issuing JWT.

---

# Dashboard Routes

All dashboard routes require JWT authentication.

---

## Dashboard

Route

/dashboard

Access

Authenticated

---

## Cases

Route

/cases

Access

Investigator

Detective

Superadmin

---

## Create Case

Route

/cases/create

Access

Investigator

Superadmin

---

## Case Detail

Route

/cases/[id]

Access

Assigned Personnel

---

## Edit Case

Route

/cases/[id]/edit

Access

Investigator

Superadmin

---

## Evidence List

Route

/evidences

Access

Assigned Personnel

---

## Register Evidence

Route

/evidences/create

Access

Investigator

---

## Evidence Detail

Route

/evidences/[id]

Access

Assigned Personnel

---

## Edit Evidence

Route

/evidences/[id]/edit

Access

Requires Detective Approval

---

## QR Scanner

Route

/qr

Access

Authenticated

---

## Custody History

Route

/custody

Access

Authenticated

---

## Audit Logs

Route

/audit-logs

Access

Superadmin

---

## System Logs

Route

/system-logs

Access

Superadmin

---

## User Management

Route

/users

Access

Superadmin

---

## User Detail

Route

/users/[id]

Access

Superadmin

---

## Profile

Route

/profile

Access

Authenticated

---

## Settings

Route

/settings

Access

Authenticated

---

# Error Routes

## Access Denied

Route

/403

Purpose

Displayed when users access unauthorized resources.

---

## Not Found

Route

/not-found

Purpose

Displayed when the requested page does not exist.

---

# Route Protection

| Route | Authentication | Authorization |
|--------|----------------|---------------|
| /login | No | Public |
| /auth/otp | No | Public |
| /auth/mfa | Temporary | Public |
| /dashboard | Yes | Authenticated |
| /cases | Yes | Role & Assignment |
| /evidences | Yes | Role & Assignment |
| /qr | Yes | Authenticated |
| /custody | Yes | Authenticated |
| /users | Yes | Superadmin |
| /audit-logs | Yes | Superadmin |
| /system-logs | Yes | Superadmin |
| /profile | Yes | Authenticated |

---

# Route Naming Convention

Rules

- Use lowercase letters.
- Use plural nouns for resources.
- Use dynamic routes for resource identifiers.

Examples

Good

/cases

/evidences

/users

/users/[id]

Bad

/Case

/GetEvidence

/UserList

---

# Folder Structure

app/

(auth)/

- login/
- auth/
  - otp/
  - mfa/

(dashboard)/

- dashboard/

- cases/
  - page.tsx
  - create/
  - [id]/
  - [id]/edit/

- evidences/
  - page.tsx
  - create/
  - [id]/
  - [id]/edit/

- custody/

- qr/

- users/
  - page.tsx
  - [id]/

- audit-logs/

- system-logs/

- profile/

- settings/

not-found.tsx

---

# Routing Summary

The routing structure follows:

- Next.js App Router
- Route Groups
- Protected Routes
- Dynamic Routes
- Role-Based Access Control (RBAC)

---

End of Document