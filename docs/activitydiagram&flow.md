Activity Diagram 1
Authentication
START
   │
   ▼
Superadmin Create User
   │
   ▼
Validate Police ID
   │
 ┌───────────────┐
 │ Valid ?       │
 └──────┬────────┘
        │Yes
        ▼
Send OTP
        │
        ▼
User Input OTP
        │
 ┌───────────────┐
 │ OTP Correct ? │
 └──────┬────────┘
        │Yes
        ▼
Create Password
        │
        ▼
Account Active
        │
        ▼
Login
        │
        ▼
Input MFA
        │
 ┌───────────────┐
 │ MFA Valid ?   │
 └──────┬────────┘
        │Yes
        ▼
RBAC Check
        │
        ▼
Dashboard
        │
      END
Activity Diagram 2
Case Creation
START

↓

Create Case

↓

Input

Case Name

Description

Crime Type

Location

↓

Save

↓

System Create Case

↓

Status = OPEN

↓

Superadmin Assign Investigator

↓

Assigned?

↓

Yes

↓

Evidence Menu Enabled

↓

END
Activity Diagram 3
Evidence Registration

Ini adalah jantung sistem.

START

↓

Investigator Create Evidence

↓

Input

Evidence Name

Category

Location

Photo

Description

↓

Save

↓

Generate UUID

↓

Encrypt Sensitive Data

↓

Generate SHA256

↓

Store Hash

↓

Generate QR AES256

↓

Save QR

↓

Print QR

↓

Attach QR to Evidence

↓

Write Audit Log

↓

END

Ini satu activity sendiri.

Karena ini proses paling penting.

Activity Diagram 4
View QR
START

↓

Scan QR

↓

Decrypt QR

↓

Find Evidence

↓

Verify SHA256

↓

Hash Match?


Jika

No

↓

Block Access

↓

Alert Superadmin

↓

Audit Log

↓

END

Jika

Yes

↓

RBAC Check

↓

Authorized?


Jika

No

↓

Access Denied

↓

Audit

↓

END

Jika

Yes

↓

Display Evidence

↓

Display Chain Of Custody

↓

Audit Log VIEW

↓

END
Activity Diagram 5
Handover Evidence

Ini cukup kompleks.

START

↓

Investigator Scan QR

↓

Verify Hash

↓

Select Recipient

↓

Select Location

↓

Create HANDOVER_DISPATCH

↓

Start Timer 3 Days

↓

Recipient Scan QR

↓

Recipient Accept?


YES

↓

HANDOVER_ACK

↓

Update Custodian

↓

Update Location

↓

Audit

↓

END

NO

↓

Timer Expired?


YES

↓

HANDOVER_FLAGGED

↓

Notify Superadmin

↓

Resolve

↓

END
Activity Diagram 6
Edit Evidence
START

↓

Request Edit

↓

Create Approval Request

↓

Detective Review

↓

Approved?


YES

↓

Update Data

↓

Recompute SHA256

↓

Generate New Hash

↓

Audit

↓

END

NO

↓

Reject

↓

Audit

↓

END

Activity Diagram 7
Soft Delete
START

↓

Request Delete

↓

Detective Review

↓

Approve?


YES

↓

Flag Deleted

↓

Cannot Access Normally

↓

Audit

↓

END

NO

↓

Reject

↓

Audit

↓

END

Activity Diagram 8
Case Lifecycle

Ini menurut saya wajib dibuat.

OPEN

↓

UNDER INVESTIGATION

↓

PENDING REVIEW

↓

REFERRED

↓

SUBMITTED TO PROSECUTION

↓

IN COURT

↓

ARCHIVED

Namun setiap perubahan status memiliki validasi:

Misalnya

Case = IN COURT

maka

Edit Evidence

×

Delete

×

Handover

×


Harus Superadmin Override.

Ini sangat penting.

Activity Diagram 9
Reporting
START

↓

Select Case

↓

Verify RBAC

↓

Generate Report

↓

Verify SHA256

↓

Hash Valid?


NO

↓

Stop Report

↓

Alert SA

↓

END

YES

↓

Generate PDF

↓

Audit

↓

END

Flow Sistem Lengkap

Kalau saya rangkai semuanya menjadi satu business flow, hasilnya seperti ini.

                    +------------------+
                    |   Superadmin     |
                    +------------------+
                             │
                             ▼
                    Create User Account
                             │
                             ▼
                   Police ID Validation
                             │
                             ▼
                          OTP Verify
                             │
                             ▼
                           Login
                             │
                             ▼
                           MFA
                             │
                             ▼
                       RBAC Dashboard
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
   Create Case                          View Assigned Case
          │
          ▼
Assign Investigator
          │
          ▼
 Status = OPEN
          │
          ▼
 Register Evidence
          │
          ▼
 Encrypt Sensitive Data
          │
          ▼
 Generate SHA256
          │
          ▼
 Generate AES256 QR
          │
          ▼
 Print QR Sticker
          │
          ▼
 Attach QR to Evidence
          │
          ▼
 Write CREATE Audit
          │
          ▼
────────────── DAILY OPERATION ──────────────
          │
          ├─────────────► View QR
          │                   │
          │                   ▼
          │              Verify Hash
          │                   │
          │          Hash OK ?──────No────►Alert SA
          │                   │
          │                  Yes
          │                   │
          │               RBAC Check
          │                   │
          │                   ▼
          │            Display Evidence
          │                   │
          │                   ▼
          │              Write Audit
          │
          ├────────────► Handover
          │                   │
          │                   ▼
          │            HANDOVER_DISPATCH
          │                   │
          │            Recipient ACK ?
          │             │             │
          │            Yes           No
          │             │             │
          │             ▼             ▼
          │       Update Custody   3 Days Timer
          │                           │
          │                           ▼
          │                     Notify SA
          │
          ├────────────► Edit Request
          │                   │
          │            Detective Approval
          │                   │
          │          Approved ?
          │             │
          │            Yes
          │             │
          │             ▼
          │      Recompute SHA256
          │             │
          │         Write Audit
          │
          ├────────────► Soft Delete
          │                   │
          │          Detective Approval
          │                   │
          │             Flag Deleted
          │
          ▼
 Case Status Update
          │
          ▼
 Pending Review
          │
          ▼
 Submitted to Prosecution
          │
          ▼
 In Court
          │
          ▼
 Archived
          │
          ▼
 Generate Report
          │
          ▼
 Verify Hash
          │
          ▼
 Export PDF
          │
          ▼
 Export Audit Log
          │
          ▼
             END