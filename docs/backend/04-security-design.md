# Forensic Chain of Custody Management System (FCCMS)

# Security Design

Version : 1.0

---

# Purpose

This document defines the security architecture of the Forensic Chain of Custody Management System (FCCMS).

The objective is to ensure:

- Confidentiality
- Integrity
- Availability
- Accountability

The system applies multiple security layers to protect digital evidence and user access.

---

# Security Principles

The backend follows these security principles:

- Least Privilege
- Defense in Depth
- Secure by Default
- Zero Trust
- Fail Secure

---

# Security Architecture

The application security consists of the following layers:

1. Authentication
2. Authorization
3. Password Protection
4. Data Encryption
5. Evidence Integrity
6. Audit Logging
7. Input Validation
8. File Upload Security
9. API Protection

---

# Authentication Security

Purpose

Verify user identity before granting access.

Implementation

- Email & Password
- MFA (TOTP)
- JWT Access Token

Business Rules

- Every login requires MFA.
- JWT is required for protected endpoints.
- Inactive users cannot log in.

---

# Authorization Security

Method

Role-Based Access Control (RBAC)

Roles

- Superadmin
- Investigator
- Detective

Rules

- Users may only access authorized resources.
- Users may only access assigned cases.
- Unauthorized requests return HTTP 403 Forbidden.

---

# Password Security

Algorithm

bcrypt

Rules

- Passwords are never stored in plaintext.
- Password comparison uses bcrypt verification.
- Password hashes are never returned by the API.

---

# Evidence Integrity

Algorithm

SHA-256

Purpose

Ensure evidence has not been modified.

Verification occurs during:

- View Evidence
- Update Evidence
- QR Operations
- Report Generation

Failure

- Operation is rejected.
- Audit Log is created.
- System Log is created.

---

# Data Encryption

Algorithm

AES-256

Encrypted Data

- QR Payload
- Sensitive Evidence Information

Purpose

Prevent unauthorized disclosure of confidential information.

---

# JWT Security

Authentication Method

Bearer Token

Header

Authorization: Bearer <token>

Rules

- JWT is validated for every protected request.
- Expired tokens are rejected.
- Invalid signatures are rejected.

---

# OTP Security

Purpose

Account activation.

Rules

- One-time use.
- Has expiration time.
- Cannot be reused.

---

# MFA Security

Implementation

TOTP

Rules

- Required after password verification.
- Required for every login.

---

# File Upload Security

Allowed Files

- JPG
- JPEG
- PNG
- PDF

Rules

- Validate file extension.
- Validate MIME type.
- Limit maximum file size.
- Store files outside the public directory.
- Generate unique file names.

---

# Input Validation

Validation Method

DTO + ValidationPipe

Validation Rules

- Required fields
- String length
- Numeric validation
- UUID validation
- Email validation

Invalid requests return HTTP 400.

---

# Audit Logging

Purpose

Record every important user activity.

Examples

- Login
- Logout
- Create Evidence
- Update Evidence
- Delete Evidence
- Generate Report

Rules

- Append-only.
- Cannot be modified.
- Cannot be deleted.

---

# System Logging

Purpose

Record application events.

Examples

- Database Error
- Authentication Failure
- Hash Verification Failure
- Server Exception

---

# API Security

Every protected endpoint must verify:

- JWT Token
- User Status
- User Role
- Resource Ownership

Requests failing validation are rejected.

---

# Security Headers

Recommended Headers

- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Content-Security-Policy

These headers help mitigate common web attacks.

---

# Rate Limiting

Purpose

Prevent brute-force attacks.

Applied To

- Login
- OTP Verification
- MFA Verification

Requests exceeding the configured limit are temporarily blocked.

---

# Security Events

The following events must be logged:

- Failed Login
- Invalid MFA
- Invalid OTP
- Unauthorized Access
- Hash Verification Failure
- File Upload Failure

---

# Security Summary

| Security Area | Technology |
|--------------|------------|
| Authentication | JWT |
| Password Hashing | bcrypt |
| MFA | TOTP |
| OTP | One-Time Password |
| Authorization | RBAC |
| Integrity | SHA-256 |
| Encryption | AES-256 |
| Validation | ValidationPipe |
| Logging | Audit Log & System Log |

---

End of Document