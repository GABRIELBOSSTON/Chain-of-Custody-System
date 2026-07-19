# Forensic Chain of Custody Management System (FCCMS)

# Frontend Page Structure

Version : 1.0

---

# Purpose

This document defines all pages available in the Forensic Chain of Custody Management System (FCCMS).

Each page represents a user interface responsible for a specific business process.

This document serves as the primary reference for frontend development using Next.js.

---

# Application Layout

The application consists of two main layouts:

1. Authentication Layout
2. Dashboard Layout

---

# Authentication Layout

Used before user login.

Pages:

- Login
- MFA Verification
- OTP Activation

---

## Login

Route

/login

Purpose

Authenticate users using email and password.

Features

- Email
- Password
- Remember Me
- Login Button
- Forgot Password (Optional)

---

## MFA Verification

Route

/auth/mfa

Purpose

Verify the MFA code after successful password authentication.

Features

- 6-digit Code Input
- Verify Button

---

## OTP Activation

Route

/auth/otp

Purpose

Activate newly created user accounts.

Features

- OTP Input
- Verify Button

---

# Dashboard Layout

Accessible only after successful authentication.

Shared Components

- Navbar
- Sidebar
- User Menu
- Notification Area
- Breadcrumb

---

# Dashboard

Route

/dashboard

Purpose

Display system overview.

Widgets

- Total Cases
- Total Evidence
- Pending Handovers
- Recent Activities

---

# Cases

Route

/cases

Purpose

Display all accessible investigation cases.

Features

- Search
- Filter
- Pagination
- Create Case
- View Detail

---

# Case Detail

Route

/cases/[id]

Purpose

Display complete case information.

Sections

- Case Information
- Assigned Personnel
- Evidence List
- Status History

---

# Create Case

Route

/cases/create

Purpose

Create a new investigation case.

---

# Edit Case

Route

/cases/[id]/edit

Purpose

Update case information.

---

# Evidence List

Route

/evidences

Purpose

Display all evidence records.

Features

- Search
- Filter
- Pagination

---

# Evidence Detail

Route

/evidences/[id]

Purpose

Display complete evidence information.

Sections

- Metadata
- Files
- QR Code
- Hash Information
- Custody Timeline

---

# Register Evidence

Route

/evidences/create

Purpose

Register new evidence.

---

# Edit Evidence

Route

/evidences/[id]/edit

Purpose

Update evidence information.

Requires Detective approval.

---

# QR Scanner

Route

/qr

Purpose

Scan evidence QR Code.

Functions

- View Evidence
- Start Handover

---

# Custody History

Route

/custody

Purpose

Display evidence transfer history.

---

# Audit Logs

Route

/audit-logs

Purpose

Display user activities.

Permission

Superadmin

---

# System Logs

Route

/system-logs

Purpose

Display application events.

Permission

Superadmin

---

# User Management

Route

/users

Purpose

Manage system users.

Permission

Superadmin

---

# Profile

Route

/profile

Purpose

Manage current user profile.

Features

- Update Profile
- Change Password
- View Role

---

# Settings

Route

/settings

Purpose

Application preferences.

Examples

- Theme
- Profile Settings
- Security Settings

---

# 404 Page

Route

/not-found

Purpose

Display when a page does not exist.

---

# Access Denied

Route

/403

Purpose

Display when a user accesses unauthorized resources.

---

# Page Summary

| Page | Permission |
|------|------------|
| Login | Public |
| OTP | Public |
| MFA | Public |
| Dashboard | Authenticated |
| Cases | Authenticated |
| Evidence | Authenticated |
| QR Scanner | Authenticated |
| Custody | Authenticated |
| Audit Logs | Superadmin |
| System Logs | Superadmin |
| Users | Superadmin |
| Profile | Authenticated |
| Settings | Authenticated |

---

End of Document