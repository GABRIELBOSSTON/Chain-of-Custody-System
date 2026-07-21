# Forensic Chain of Custody Management System (FCCMS)

This repository contains the Forensic Chain of Custody Management System (FCCMS). The system maintains secure, tamper-proof tracking of criminal case evidence and its custodianship timeline.

## Directory Structure

- `/backend`: NestJS application utilizing TypeScript, Prisma ORM, and JWT/MFA security.
- `/frontend`: Next.js 15 application utilizing TypeScript, TailwindCSS, and Shadcn UI.
- `/uploads`: Local storage directory for media assets:
  - `/uploads/evidence`: Digital exhibits and crime scene photos.
  - `/uploads/profile`: User account profiles.
  - `/uploads/documents`: Generated custody and investigation reports.
- `/docs`: Project guidelines, architecture design documents, and system specifications.

## Technology Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database ORM**: Prisma ORM with MariaDB (MySQL 8)
- **Security**: JWT Authentication, bcrypt hashing, Speakeasy Multi-Factor Authentication (TOTP)
- **Integrity Check**: SHA-256 Checksums & AES-256 Encrypted QR Code generation

### Frontend
- **Framework**: Next.js 15 (TypeScript)
- **Styles**: TailwindCSS & Shadcn UI
- **Form Control**: React Hook Form with Zod schema verification

## Roadmap

Development is implemented using an incremental, backend-first, module-by-module strategy detailed in the implementation plan.
