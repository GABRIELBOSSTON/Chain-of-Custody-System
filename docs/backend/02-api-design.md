# Forensic Chain of Custody Management System (FCCMS)

# API Design

Version : 1.0

---

# Purpose

This document defines the REST API contract for the Forensic Chain of Custody Management System (FCCMS).

The API follows RESTful principles and JSON as the primary data exchange format.

This document defines:

- API endpoints
- HTTP methods
- Authentication requirements
- Request and response structure

Implementation details are not included in this document.

---

# Base URL

Development

/api/v1

Example

/api/v1/auth/login

---

# Authentication

Authentication Method

- JWT Bearer Token

Protected Routes

All endpoints except:

- Login
- MFA Verification
- OTP Verification

Header

Authorization: Bearer <JWT_TOKEN>

---

# API Modules

1. Authentication
2. Users
3. Roles
4. Cases
5. Evidence
6. Custody
7. Audit Logs
8. System Logs

---

# Authentication API

## Login

POST

/auth/login

Description

Authenticate user using email and password.

Authentication

Public

---

## Verify MFA

POST

/auth/mfa/verify

Description

Verify MFA code after successful login.

Authentication

Temporary Session

---

## Verify OTP

POST

/auth/otp/verify

Description

Verify account activation OTP.

Authentication

Public

---

## Logout

POST

/auth/logout

Description

Invalidate current session.

Authentication

JWT Required

---

# User API

## Get Users

GET

/users

Description

Retrieve all users.

---

## Get User

GET

/users/{id}

Description

Retrieve a single user.

---

## Create User

POST

/users

Description

Create a new user.

Permission

Superadmin

---

## Update User

PUT

/users/{id}

Description

Update user information.

---

## Soft Delete User

DELETE

/users/{id}

Description

Deactivate user account.

---

# Role API

## Get Roles

GET

/roles

Description

Retrieve all available roles.

---

# Case API

## Get Cases

GET

/cases

---

## Get Case

GET

/cases/{id}

---

## Create Case

POST

/cases

---

## Update Case

PUT

/cases/{id}

---

## Change Case Status

PATCH

/cases/{id}/status

---

## Assign Personnel

POST

/cases/{id}/assignments

---

# Evidence API

## Get Evidences

GET

/evidences

---

## Get Evidence

GET

/evidences/{id}

---

## Register Evidence

POST

/evidences

---

## Update Evidence

PUT

/evidences/{id}

---

## Upload Evidence File

POST

/evidences/{id}/files

---

## Get Evidence Files

GET

/evidences/{id}/files

---

## Generate QR

POST

/evidences/{id}/qr

---

## View QR Information

GET

/evidences/{id}/qr

---

## Verify Evidence Hash

POST

/evidences/{id}/verify

---

# Custody API

## Handover Evidence

POST

/custody/handover

---

## Confirm Handover

POST

/custody/confirm

---

## Get Custody History

GET

/custody/{evidenceId}

---

# Audit API

## Get Audit Logs

GET

/audit-logs

---

## Export Audit Logs

GET

/audit-logs/export

Permission

Superadmin

---

# System Log API

## Get System Logs

GET

/system-logs

Permission

Superadmin

---

# HTTP Status Codes

200 OK

Successful request.

201 Created

Resource successfully created.

400 Bad Request

Validation failed.

401 Unauthorized

Authentication required.

403 Forbidden

Permission denied.

404 Not Found

Resource not found.

409 Conflict

Duplicate data or business rule conflict.

422 Unprocessable Entity

Business rule validation failed.

500 Internal Server Error

Unexpected server error.

---

# API Versioning

Current Version

v1

Future versions

v2

v3

Versioning Strategy

URI Versioning

Example

/api/v1/evidences

---

# Naming Convention

Resources use plural nouns.

Examples

/users

/cases

/evidences

/custody

HTTP methods follow REST conventions.

GET

Retrieve data.

POST

Create data.

PUT

Replace existing data.

PATCH

Partial update.

DELETE

Soft delete.

---

End of Document