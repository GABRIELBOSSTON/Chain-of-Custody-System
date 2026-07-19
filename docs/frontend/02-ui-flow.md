# Forensic Chain of Custody Management System (FCCMS)

# UI Flow

Version : 1.0

---

# Purpose

This document defines the navigation flow of the Forensic Chain of Custody Management System (FCCMS).

The objective is to describe how users move between pages while performing business processes.

This document focuses on user navigation and interaction rather than backend implementation.

---

# User Roles

The application supports three user roles:

- Superadmin
- Investigator
- Detective

Each role only sees pages and actions based on their permissions.

---

# Overall Navigation

```text
Login
    │
    ▼
MFA Verification
    │
    ▼
Dashboard
    │
 ┌──┼─────────────┬─────────────┬─────────────┐
 ▼  ▼             ▼             ▼             ▼
Cases  Evidence  QR Scanner  Audit Logs  Profile
```

---

# Authentication Flow

```text
Login
    │
    ▼
Enter Email & Password
    │
    ▼
Credentials Valid?
    │
 ┌──┴─────┐
 │        │
No       Yes
 │        │
 ▼        ▼
Error   MFA Verification
              │
              ▼
        Dashboard
```

---

# Dashboard Flow

```text
Dashboard
    │
 ┌──┼──────────┬──────────┬─────────┐
 ▼  ▼          ▼          ▼         ▼
Cases Evidence QR      Profile  Settings
```

---

# Case Management Flow

```text
Cases
    │
 ┌──┴───────────┐
 ▼              ▼
Create Case   Case Detail
                  │
         ┌────────┼────────┐
         ▼        ▼        ▼
    Edit Case Evidence Status History
```

---

# Evidence Flow

```text
Evidence List
      │
      ▼
Evidence Detail
      │
 ┌────┼─────────────┬────────────┐
 ▼    ▼             ▼            ▼
Files QR Code Custody Timeline Hash Info
      │
      ▼
Edit Evidence
```

---

# QR Flow

```text
QR Scanner
      │
      ▼
Scan QR
      │
      ▼
QR Valid?
   │
┌──┴─────┐
│        │
No      Yes
│        │
▼        ▼
Error  Evidence Detail
             │
      ┌──────┴──────┐
      ▼             ▼
 View Only     Start Handover
```

---

# Custody Flow

```text
Evidence Detail
      │
      ▼
Start Handover
      │
      ▼
Recipient Scan
      │
      ▼
Recipient Confirm
      │
      ▼
Custody Updated
```

---

# User Management Flow

```text
Users
    │
 ┌──┼─────────────┐
 ▼  ▼             ▼
Create Edit    View Detail
```

---

# Audit Flow

```text
Audit Logs
      │
      ▼
Search
      │
      ▼
Filter
      │
      ▼
View Detail
```

---

# Profile Flow

```text
Profile
    │
 ┌──┼─────────────┐
 ▼  ▼             ▼
Edit Profile Change Password View Role
```

---

# Error Flow

```text
Page Request
      │
      ▼
Authorized?
   │
┌──┴────┐
│       │
No     Yes
│       │
▼       ▼
403   Requested Page
```

---

# Logout Flow

```text
Profile Menu
      │
      ▼
Logout
      │
      ▼
JWT Removed
      │
      ▼
Redirect to Login
```

---

# Navigation Rules

- Protected pages require authentication.
- Unauthorized users are redirected to the 403 page.
- Expired sessions redirect users to the Login page.
- Navigation menus are displayed based on user role (RBAC).
- Breadcrumbs are shown on dashboard pages.

---

# UI Flow Summary

| Feature | Entry Page | Destination |
|---------|------------|-------------|
| Login | /login | /dashboard |
| Case Management | /cases | /cases/[id] |
| Evidence | /evidences | /evidences/[id] |
| QR Scanner | /qr | /evidences/[id] |
| Custody | /custody | /custody/[id] |
| User Management | /users | /users/[id] |
| Audit Logs | /audit-logs | Detail View |
| Profile | /profile | Update Profile |

---

End of Document