# Forensic Chain of Custody Management System (FCCMS)

# Table Specification

Version : 1.1

---

# Purpose

This document provides column-level specifications for all 18 core database tables in the FCCMS.

---

## 1. roles
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| name | VARCHAR(50) | Yes | Role Name (e.g., SUPERADMIN) |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: Unique(name).

---

## 2. users
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| role_id | UUID | Yes | Reference to roles |
| email | VARCHAR(150) | Yes | Login email |
| password | VARCHAR(255) | Yes | bcrypt hash |
| is_active | BOOLEAN | Yes | Account status |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |
| deleted_at | TIMESTAMP | No | Soft delete |
| deleted_by | UUID | No | Soft delete actor |

Constraints: Unique(email). FK: role_id -> roles.id, deleted_by -> users.id.
Indexes: (deleted_at, is_active), email, role_id.

---

## 3. police_profiles
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| user_id | UUID | Yes | Reference to users |
| police_id | VARCHAR(30) | Yes | Badge Number |
| full_name | VARCHAR(150) | Yes | |
| phone | VARCHAR(20) | No | |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: Unique(user_id), Unique(police_id). FK: user_id -> users.id.

---

## 4. otp_verifications
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| user_id | UUID | Yes | Reference to users |
| otp_code | VARCHAR(10) | Yes | |
| expires_at | TIMESTAMP | Yes | |
| is_used | BOOLEAN | Yes | |
| created_at | TIMESTAMP | Yes | |

Constraints: FK: user_id -> users.id.

---

## 5. mfa_secrets
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| user_id | UUID | Yes | Reference to users |
| secret | VARCHAR(255) | Yes | |
| is_enabled | BOOLEAN | Yes | |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: Unique(user_id). FK: user_id -> users.id.

---

## 6. cases
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| case_number| VARCHAR(100) | Yes | Unique case identifier |
| title | VARCHAR(255) | Yes | |
| description| TEXT | No | |
| status | ENUM | Yes | OPEN, CLOSED, etc. |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |
| deleted_at | TIMESTAMP | No | |

Constraints: Unique(case_number).

---

## 7. case_assignments
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| case_id | UUID | Yes | |
| user_id | UUID | Yes | |
| assigned_at| TIMESTAMP | Yes | |

Constraints: Unique(case_id, user_id). FK: case_id -> cases.id, user_id -> users.id.

---

## 8. case_status_history
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| case_id | UUID | Yes | |
| status | ENUM | Yes | |
| changed_by | UUID | Yes | Reference to users |
| changed_at | TIMESTAMP | Yes | |

Constraints: FK: case_id -> cases.id, changed_by -> users.id.

---

## 9. evidences
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| case_id | UUID | Yes | |
| name | VARCHAR(255) | Yes | |
| description| TEXT | No | |
| current_location| VARCHAR(255)| Yes | |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |
| deleted_at | TIMESTAMP | No | |

Constraints: FK: case_id -> cases.id.

---

## 10. evidence_approvals
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| evidence_id| UUID | Yes | |
| requested_by| UUID | Yes | Reference to users |
| approved_by| UUID | No | Reference to users (Detective) |
| status | ENUM | Yes | PENDING, APPROVED, REJECTED |
| action_type| ENUM | Yes | EDIT, SOFT_DELETE |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: FK: evidence_id -> evidences.id, requested_by -> users.id, approved_by -> users.id.

---

## 11. attachments
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| evidence_id| UUID | Yes | |
| file_path | VARCHAR(500) | Yes | |
| file_type | VARCHAR(50) | Yes | |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: FK: evidence_id -> evidences.id.

---

## 12. evidence_hashes
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| evidence_id| UUID | Yes | |
| hash_value | VARCHAR(64) | Yes | SHA-256 |
| generated_at| TIMESTAMP | Yes | |

Constraints: FK: evidence_id -> evidences.id.

---

## 13. qr_codes
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| evidence_id| UUID | Yes | |
| qr_payload | TEXT | Yes | Encrypted data |
| is_active | BOOLEAN | Yes | |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

Constraints: FK: evidence_id -> evidences.id.

---

## 14. custody_events
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| evidence_id| UUID | Yes | |
| action | ENUM | Yes | e.g. TRANSFER, RECEIVE |
| actor_id | UUID | Yes | User performing action |
| recipient_id| UUID | No | User receiving evidence |
| location | VARCHAR(255) | Yes | |
| event_time | TIMESTAMP | Yes | |

Constraints: FK: evidence_id -> evidences.id, actor_id -> users.id, recipient_id -> users.id.

---

## 15. audit_logs
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| user_id | UUID | No | Null if system generated |
| action | VARCHAR(255) | Yes | |
| entity_id | UUID | No | ID of affected entity |
| entity_type| VARCHAR(50) | No | Table name |
| timestamp | TIMESTAMP | Yes | |

Constraints: FK: user_id -> users.id.

---

## 16. system_logs
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| level | VARCHAR(20) | Yes | INFO, ERROR, WARNING |
| message | TEXT | Yes | |
| user_id | UUID | No | Optional reference |
| timestamp | TIMESTAMP | Yes | |

Constraints: FK: user_id -> users.id.

---

## 17. reports
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| case_id | UUID | Yes | |
| generated_by| UUID | Yes | Reference to users |
| report_data| JSON | Yes | |
| created_at | TIMESTAMP | Yes | |

Constraints: FK: case_id -> cases.id, generated_by -> users.id.

---

## 18. report_exports
| Column | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary Key |
| report_id | UUID | Yes | |
| exported_by| UUID | Yes | Reference to users |
| export_format| VARCHAR(10) | Yes | PDF, CSV |
| exported_at| TIMESTAMP | Yes | |

Constraints: FK: report_id -> reports.id, exported_by -> users.id.

---

End of Document