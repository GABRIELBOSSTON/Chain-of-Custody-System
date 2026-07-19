# Forensic Chain of Custody Management System (FCCMS)

# API Integration

Version : 1.0

---

# Purpose

This document defines how the frontend communicates with the backend REST API.

The objective is to ensure a consistent approach to API requests, authentication, error handling, and response processing throughout the application.

---

# Technology

Frontend

- Next.js 15
- TypeScript
- Axios

Backend

- NestJS
- REST API
- JWT Authentication

---

# Base URL

Development

```
http://localhost:3000/api
```

Production

Configured using environment variables.

---

# Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

# Axios Configuration

A single Axios instance should be created.

Responsibilities

- Base URL configuration
- Authorization header
- Timeout configuration
- Error interception

---

# Authentication

Protected endpoints require JWT.

Example

```
Authorization: Bearer <access_token>
```

The frontend stores the JWT securely and includes it in every authenticated request.

---

# Request Flow

```text
User Action
      │
      ▼
React Component
      │
      ▼
API Service
      │
      ▼
Axios Instance
      │
      ▼
NestJS API
      │
      ▼
Database
```

---

# API Folder Structure

```
src/

services/

auth.service.ts

case.service.ts

evidence.service.ts

custody.service.ts

user.service.ts

audit.service.ts

report.service.ts
```

Each service is responsible for one backend module.

---

# Request Methods

| Method | Purpose |
|---------|----------|
| GET | Retrieve data |
| POST | Create data |
| PUT | Replace data |
| PATCH | Partial update |
| DELETE | Delete data |

---

# Authentication API

Login

POST

```
/auth/login
```

MFA Verification

POST

```
/auth/mfa
```

OTP Activation

POST

```
/auth/otp
```

---

# Case API

GET

```
/cases
```

GET

```
/cases/:id
```

POST

```
/cases
```

PUT

```
/cases/:id
```

DELETE

```
/cases/:id
```

---

# Evidence API

GET

```
/evidences
```

GET

```
/evidences/:id
```

POST

```
/evidences
```

PUT

```
/evidences/:id
```

DELETE

```
/evidences/:id
```

---

# Custody API

GET

```
/custody
```

POST

```
/custody
```

---

# User API

GET

```
/users
```

POST

```
/users
```

PUT

```
/users/:id
```

DELETE

```
/users/:id
```

---

# Audit API

GET

```
/audit-logs
```

---

# Report API

GET

```
/reports
```

---

# Upload API

Evidence File Upload

POST

```
/upload/evidence
```

Profile Picture

POST

```
/upload/profile
```

---

# API Response

Every successful request follows the backend response standard.

```json
{
    "success": true,
    "message": "Evidence retrieved successfully.",
    "data": {},
    "meta": {
        "timestamp": "2026-07-20T10:15:30Z",
        "requestId": "uuid"
    }
}
```

---

# Error Response

```json
{
    "success": false,
    "message": "Evidence not found.",
    "error": "EVIDENCE_NOT_FOUND",
    "meta": {
        "timestamp": "2026-07-20T10:15:30Z",
        "requestId": "uuid"
    }
}
```

---

# Error Handling

Frontend should handle:

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Validation Error
- 500 Internal Server Error

Appropriate notifications should be displayed to the user.

---

# Loading State

Every API request should display a loading indicator until completion.

Examples

- Login
- Register Evidence
- Upload File
- Generate Report

---

# Retry Policy

Automatic retries are not enabled.

Users may manually retry failed operations.

---

# Security Guidelines

- Always use HTTPS in production.
- Never expose JWT secrets.
- Never log sensitive information in the browser.
- Validate all user input before sending requests.
- Remove expired tokens immediately.

---

# API Integration Summary

The frontend communicates with the backend using:

- REST API
- Axios
- JWT Authentication
- Environment Variables
- Standardized JSON Responses

---

End of Document