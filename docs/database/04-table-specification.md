# Table : users

---

## Purpose

Stores all authenticated system users.

---

## Business Rules

- Created only by Superadmin.
- Police ID must be unique.
- Email must be unique.
- Password uses bcrypt.
- Login requires MFA.
- Soft Delete enabled.

---

## Columns

| Column | Type | Required | Description |
|---------|------|----------|-------------|
| id | UUID | Yes | Primary Key |
| role_id | UUID | Yes | Reference to roles |
| police_id | VARCHAR(30) | Yes | Official police identification |
| full_name | VARCHAR(150) | Yes | User full name |
| email | VARCHAR(150) | Yes | Login email |
| password | VARCHAR(255) | Yes | bcrypt hash |
| phone | VARCHAR(20) | No | Contact number |
| is_active | BOOLEAN | Yes | Account status |
| created_at | TIMESTAMP | Yes | Creation timestamp |
| updated_at | TIMESTAMP | Yes | Last update |
| deleted_at | TIMESTAMP | No | Soft delete timestamp |
| deleted_by | UUID | No | User performing soft delete |

---

## Constraints

Primary Key

- id

Foreign Keys

- role_id → roles.id

Unique

- email
- police_id

---

## Index

- email
- police_id
- role_id

---

## Referenced By

- case_assignments
- audit_logs
- custody_events

---

## Soft Delete

Supported

---

## Audit

Create ✔

Update ✔

Delete (Soft Delete Only)

---

## Notes

Passwords must never be returned by API responses.

Password comparisons use bcrypt.

MFA configuration is stored separately.