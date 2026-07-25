# Database Seed Strategy

## 1. Purpose

This document defines the initial data that must exist before the FCCMS application can be used.

The objective of database seeding is to provide a consistent development environment and ensure that every developer starts with the same baseline data.

---

# 2. Objectives

The seed process aims to:

- Create default system roles.
- Create the initial Superadmin account.
- Provide reference data required by the application.
- Ensure consistent development and testing environments.

---

# 3. Seed Execution Order

The database seed process should follow this order:

1. Role
2. User (Superadmin)
3. PoliceProfile (Superadmin)
4. System Configuration (if applicable)

The order is important because some entities depend on existing records.

---

# 4. Default Roles

The system should create the following roles during the seed process.

| Role | Description |
|-------|-------------|
| SUPERADMIN | Full system access |
| DETECTIVE | Manage investigations and evidence |
| INVESTIGATOR | Collect and update evidence |
| OFFICER | Limited operational access |
| PROSECUTOR | Read-only access for prosecution process |

Additional roles may be added in future versions if required.

---

# 5. Initial Superadmin

The first Superadmin account should be created automatically during seeding.

Example:

Email:
admin@fccms.local

Password:
Configured through environment variables or changed immediately after deployment.

The password must never be stored in plain text.

---

# 6. Password Policy

All seeded passwords must:

- Be hashed using bcrypt.
- Never be stored in plain text.
- Be changed before production deployment.

---

# 7. Seed Principles

The seed process must be:

- Repeatable
- Deterministic
- Safe for development
- Independent of production data

---

# 8. Production Notes

Production environments should not rely on development seed data.

Only essential administrative accounts and required reference data should be created.

---

# 9. Future Seed Data

Additional seed data may include:

- Case Status
- Evidence Status
- Audit Action
- Custody Action
- Notification Type

These data should be treated as reference data and managed consistently.

---

# 10. Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Initial Version | Initial seed strategy |