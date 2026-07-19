# Forensic Chain of Custody Management System (FCCMS)

# File Storage Design

Version : 1.0

---

# Purpose

This document defines the file storage architecture used by the Forensic Chain of Custody Management System (FCCMS).

The objective is to ensure that all uploaded files are stored securely, consistently, and can be referenced efficiently by the application.

The database stores only metadata and file paths.

The physical files are stored on the local server.

---

# Storage Type

Environment

Development

Storage

Local File System

Database

MySQL 8

---

# Storage Structure

uploads/

├── evidence/
│
├── profile/
│
└── documents/

---

# Directory Description

## evidence/

Stores files related to evidence.

Examples

- Crime scene photos
- Videos
- Audio recordings
- Laboratory results

---

## profile/

Stores user profile images.

---

## documents/

Stores generated documents and supporting files.

Examples

- Investigation reports
- Official attachments
- Other reference documents

---

# Database Strategy

The application stores:

- File Name
- Original File Name
- File Path
- File Size
- MIME Type
- Upload Time

The application does NOT store binary files inside the database.

---

# Supported File Types

Images

- JPG
- JPEG
- PNG

Documents

- PDF

Videos

- MP4

Audio

- MP3
- WAV

---

# File Naming Convention

Uploaded files are renamed automatically.

Format

<UUID>.<extension>

Example

550e8400-e29b-41d4-a716-446655440000.jpg

Reason

- Prevent duplicate names
- Hide original file names
- Simplify storage

---

# Upload Process

User selects file

↓

Backend validates request

↓

Validate extension

↓

Validate MIME Type

↓

Validate file size

↓

Generate UUID filename

↓

Save file to local storage

↓

Save metadata to database

↓

Return success response

---

# Validation Rules

Maximum File Size

20 MB per file

Allowed Extensions

- jpg
- jpeg
- png
- pdf
- mp4
- mp3
- wav

Invalid files are rejected.

---

# Security Rules

- Validate file extension.
- Validate MIME type.
- Reject executable files.
- Reject unsupported file types.
- Store files outside the public directory.
- Generate random filenames.
- Never trust the original filename.

---

# File Metadata

Every uploaded file contains:

- File UUID
- Original Filename
- Stored Filename
- File Extension
- MIME Type
- File Size
- Upload Time
- Uploaded By
- Evidence ID

---

# File Access

Files cannot be accessed directly from the storage directory.

Every file request must pass through the backend.

The backend validates:

- JWT Authentication
- User Role
- Case Assignment
- Evidence Permission

If validation succeeds, the file is returned.

Otherwise, HTTP 403 Forbidden is returned.

---

# File Update

Uploaded files cannot be modified.

If a replacement is required:

- Upload a new file.
- Record the action in Audit Log.
- Keep previous file history if required by business rules.

---

# File Deletion

Physical files are deleted only when:

- Superadmin performs an approved hard delete.
- Business rules allow permanent deletion.

Otherwise:

- Database record uses Soft Delete.
- Physical file remains stored.

---

# Backup Strategy

Development

Manual backup.

Production

Scheduled backup.

The backup includes:

- MySQL Database
- uploads/ directory

---

# File Storage Summary

| Component | Storage |
|-----------|----------|
| Database | MySQL |
| Physical Files | Local Storage |
| Naming | UUID |
| Images | JPG, JPEG, PNG |
| Documents | PDF |
| Videos | MP4 |
| Audio | MP3, WAV |

---

End of Document