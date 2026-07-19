# Forensic Chain of Custody Management System (FCCMS)

# Error Handling Standard

Version : 1.0

---

# Purpose

This document defines the standard error handling mechanism used by the Forensic Chain of Custody Management System (FCCMS).

The objective is to ensure that every API returns consistent, predictable, and informative error responses.

This standard applies to all backend modules.

---

# Error Handling Principles

The backend follows these principles:

- Consistent Response Format
- Meaningful Error Messages
- Appropriate HTTP Status Codes
- No Sensitive Information Disclosure
- Detailed Logging
- User-Friendly Messages

---

# Standard Error Response

Every failed request returns the following structure.

```json
{
    "success": false,
    "statusCode": 404,
    "message": "Evidence not found.",
    "error": "NOT_FOUND",
    "timestamp": "2026-07-20T10:15:30Z",
    "path": "/api/v1/evidences/123"
}
```

---

# Response Fields

| Field | Description |
|--------|-------------|
| success | Always false |
| statusCode | HTTP status code |
| message | Human-readable error message |
| error | Internal error identifier |
| timestamp | UTC timestamp |
| path | Requested API endpoint |

---

# HTTP Status Codes

## 400 Bad Request

The request is invalid.

Examples

- Missing required fields
- Invalid request format

---

## 401 Unauthorized

Authentication is required.

Examples

- Missing JWT
- Invalid JWT
- Expired JWT

---

## 403 Forbidden

The authenticated user does not have permission.

Examples

- Accessing unassigned case
- Insufficient role

---

## 404 Not Found

Requested resource does not exist.

Examples

- User not found
- Case not found
- Evidence not found

---

## 409 Conflict

Business conflict.

Examples

- Duplicate email
- Duplicate Police ID
- Duplicate Case Number

---

## 422 Unprocessable Entity

Business rule validation failed.

Examples

- Hash verification failed
- Case already archived
- Evidence edit requires approval
- Invalid custody transfer

---

## 429 Too Many Requests

Too many requests in a short period.

Examples

- Login attempts exceeded
- OTP verification exceeded

---

## 500 Internal Server Error

Unexpected server error.

Examples

- Database failure
- Unhandled exception

---

# Business Error Codes

| Error Code | Description |
|------------|-------------|
| INVALID_CREDENTIALS | Incorrect email or password |
| INVALID_OTP | OTP verification failed |
| INVALID_MFA | MFA verification failed |
| USER_NOT_FOUND | User does not exist |
| CASE_NOT_FOUND | Case does not exist |
| EVIDENCE_NOT_FOUND | Evidence does not exist |
| HASH_VERIFICATION_FAILED | SHA-256 verification failed |
| QR_INVALID | Invalid QR Code |
| PERMISSION_DENIED | RBAC validation failed |
| CASE_ARCHIVED | Case is archived |
| DUPLICATE_EMAIL | Email already exists |
| DUPLICATE_POLICE_ID | Police ID already exists |

---

# Exception Handling

All exceptions must be handled by the Global Exception Filter.

Unhandled exceptions must never expose:

- Stack Trace
- Database Schema
- SQL Query
- Environment Variables
- Internal File Paths

---

# Logging Rules

The backend records every unexpected error into System Logs.

Critical security events are also recorded in Audit Logs.

Examples

- Login Failure
- Unauthorized Access
- Hash Verification Failure

---

# Validation Errors

Validation failures return HTTP 400.

Example

```json
{
    "success": false,
    "statusCode": 400,
    "message": "Validation failed.",
    "error": "VALIDATION_ERROR",
    "details": [
        {
            "field": "email",
            "message": "Email is required."
        },
        {
            "field": "password",
            "message": "Password must be at least 8 characters."
        }
    ]
}
```

---

# Business Rule Errors

Business rule violations return HTTP 422.

Example

```json
{
    "success": false,
    "statusCode": 422,
    "message": "Evidence integrity verification failed.",
    "error": "HASH_VERIFICATION_FAILED"
}
```

---

# Unexpected Errors

Unexpected errors return HTTP 500.

Example

```json
{
    "success": false,
    "statusCode": 500,
    "message": "An unexpected error occurred.",
    "error": "INTERNAL_SERVER_ERROR"
}
```

---

# Error Handling Flow

```text
Request
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Exception?
    │
 ┌──┴──┐
 │     │
No    Yes
 │     │
 ▼     ▼
Response
      │
      ▼
Global Exception Filter
      │
      ▼
Log Error
      │
      ▼
Standard Error Response
```

---

# Summary

The backend guarantees:

- Consistent error responses.
- Proper HTTP status codes.
- Secure error handling.
- Centralized exception management.
- Comprehensive logging.

---

End of Document