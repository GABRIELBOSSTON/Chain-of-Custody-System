# Forensic Chain of Custody Management System (FCCMS)

# Response Standard

Version : 1.0

---

# Purpose

This document defines the standard API response format used throughout the Forensic Chain of Custody Management System (FCCMS).

All backend modules must follow the same response structure to ensure consistency, simplify frontend integration, and improve maintainability.

---

# Response Principles

The API response must be:

- Consistent
- Predictable
- Readable
- RESTful
- JSON-based

---

# Success Response Structure

Every successful request returns:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Request completed successfully.",
    "data": {},
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# Response Fields

| Field | Description |
|--------|-------------|
| success | Request status |
| statusCode | HTTP status code |
| message | Human-readable message |
| data | Response payload |
| timestamp | UTC timestamp |

---

# HTTP Status Codes

| Status | Meaning |
|---------|----------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |

---

# GET Response

Example

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Evidence retrieved successfully.",
    "data": {
        "id": "uuid",
        "name": "Knife",
        "caseNumber": "CASE-2026-001"
    },
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# POST Response

Example

```json
{
    "success": true,
    "statusCode": 201,
    "message": "Evidence created successfully.",
    "data": {
        "id": "uuid"
    },
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# PUT Response

Example

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Evidence updated successfully.",
    "data": {
        "id": "uuid"
    },
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# PATCH Response

Example

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Case status updated successfully.",
    "data": {
        "status": "UNDER_INVESTIGATION"
    },
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# DELETE Response

Example

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Evidence deleted successfully.",
    "data": null,
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# List Response

When returning multiple records:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Cases retrieved successfully.",
    "data": [
        {},
        {},
        {}
    ],
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# Pagination Response

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Cases retrieved successfully.",
    "data": [
        {}
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "totalData": 120,
        "totalPages": 12
    },
    "timestamp": "2026-07-20T10:15:30Z"
}
```

---

# Empty Response

When no data is found:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "No data found.",
    "data": []
}
```

---

# Download Response

For file downloads:

Headers

```
Content-Type
Content-Disposition
Content-Length
```

The response returns the requested file directly.

---

# Response Guidelines

Every response must:

- Return valid JSON (except file downloads)
- Include HTTP status code
- Include a readable message
- Include UTC timestamp
- Use camelCase for JSON properties

---

# Message Guidelines

Messages should be:

Good Examples

- User created successfully.
- Evidence updated successfully.
- QR Code generated successfully.
- Audit log exported successfully.

Avoid

- Success.
- OK.
- Done.
- Completed.

---

# Data Guidelines

The `data` field should:

Contain:

- Requested resource
- Collection of resources
- Created object
- Updated object

Never contain:

- Password
- OTP
- MFA Secret
- JWT Secret
- Internal Server Information

---

# API Response Summary

| Operation | Status |
|------------|--------|
| GET | 200 |
| POST | 201 |
| PUT | 200 |
| PATCH | 200 |
| DELETE | 200 |
| Download | File Stream |

---

End of Document