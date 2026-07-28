import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { evidenceSelect } from './constants/evidence-select';
import { CaseStatus, EvidenceStatus, ApprovalStatus, ApprovalActionType } from '@prisma/client';
import { encryptField, decryptField, encryptRoute, decryptRoute } from '../common/utils/crypto.util';

@Injectable()
export class EvidencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEvidenceDto: CreateEvidenceDto, userId: string, file?: Express.Multer.File) {
    // BR-020: Evidence cannot be added unless case status is OPEN
    const relatedCase = await this.prisma.case.findUnique({
      where: { id: createEvidenceDto.caseId },
    });

    if (!relatedCase || relatedCase.deletedAt) {
      throw new NotFoundException(`Case with ID ${createEvidenceDto.caseId} not found`);
    }

    // "OPEN" in BR-020 refers to the logical lifecycle category of active investigations, not strictly CaseStatus.OPEN.
    const activeStatuses: CaseStatus[] = [
      CaseStatus.OPEN,
      CaseStatus.UNDER_INVESTIGATION,
      CaseStatus.PENDING_REVIEW,
      CaseStatus.REFERRED,
      CaseStatus.SUBMITTED_TO_PROSECUTION,
      CaseStatus.IN_COURT
    ];

    const isStatusValid = activeStatuses.includes(relatedCase.status);

    if (!isStatusValid) {
      throw new BadRequestException(`Evidence can only be added to cases with an active 'OPEN' lifecycle status. Current status: ${relatedCase.status}`);
    }

    const existingEvidence = await this.prisma.evidence.findUnique({
      where: { evidenceNumber: createEvidenceDto.evidenceNumber },
    });

    if (existingEvidence) {
      throw new ConflictException(`Evidence with number ${createEvidenceDto.evidenceNumber} already exists`);
    }

    return this.prisma.$transaction(async (prisma) => {
      let dataDescription = createEvidenceDto.description;
      if (dataDescription) {
        dataDescription = encryptField(dataDescription) || undefined;
      }

      const newEvidence = await prisma.evidence.create({
        data: {
          ...createEvidenceDto,
          description: dataDescription,
          status: createEvidenceDto.status || EvidenceStatus.SEIZED,
          collectionDate: new Date(createEvidenceDto.collectionDate),
        },
        select: evidenceSelect,
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_EVIDENCE',
          entityId: newEvidence.id,
          entityType: 'Evidence',
          description: `Created evidence ${newEvidence.evidenceNumber}`,
        }
      });

      if (file) {
        await prisma.attachment.create({
          data: {
            evidenceId: newEvidence.id,
            fileName: file.originalname,
            filePath: `/uploads/evidences/${file.filename}`,
            mimeType: file.mimetype,
            fileSize: file.size,
          }
        });

        const fileBuffer = fs.readFileSync(file.path);
        const hashValue = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        await prisma.evidenceHash.create({
          data: {
            evidenceId: newEvidence.id,
            hashValue,
            generatedAt: new Date(),
          }
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: 'UPLOAD_ATTACHMENT',
            entityId: newEvidence.id,
            entityType: 'Evidence',
            description: `Uploaded file ${file.originalname}`,
          }
        });
      }

      // Generate QR Code containing encrypted internal URL
      const route = `/evidences/${newEvidence.id}/detail`;
      const encryptedRoute = encryptRoute(route);
      const frontendUrl = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5173';
      const qrPayload = `${frontendUrl}/qr-redirect?payload=${encryptedRoute}`;
      const qrDataUrl = await QRCode.toDataURL(qrPayload);

      await prisma.qRCode.create({
        data: {
          evidenceId: newEvidence.id,
          qrPayload: qrDataUrl,
          isActive: true
        }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'GENERATE_QR_CODE',
          entityId: newEvidence.id,
          entityType: 'Evidence',
          description: `Generated QR Code for evidence ${newEvidence.evidenceNumber}`,
        }
      });

      // Re-fetch evidence to include attachments, hashes, and qrCode since we just created them
      const ev = await prisma.evidence.findUnique({
        where: { id: newEvidence.id },
        select: evidenceSelect,
      });
      if (ev && ev.description) {
        ev.description = decryptField(ev.description) as string;
      }
      return ev;
    });
  }

  async findAll(caseId?: string) {
    const evidences = await this.prisma.evidence.findMany({
      where: { 
        deletedAt: null,
        ...(caseId ? { caseId } : {})
      },
      select: evidenceSelect,
      orderBy: { createdAt: 'desc' },
    });

    return evidences.map(ev => {
      if (ev.description) {
        ev.description = decryptField(ev.description) as string;
      }
      return ev;
    });
  }

  async findById(id: string) {
    const evidence = await this.prisma.evidence.findFirst({
      where: { id, deletedAt: null },
      select: evidenceSelect,
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    if (evidence.description) {
      evidence.description = decryptField(evidence.description) as string;
    }

    return evidence;
  }

  async findByIdWithAudit(id: string, userId: string, ip?: string) {
    const evidence = await this.findById(id);

    // Record the VIEW_EVIDENCE action in the audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VIEW_EVIDENCE',
        entityId: id,
        entityType: 'Evidence',
        description: `Viewed evidence ${evidence.evidenceNumber}. IP: ${ip || 'Unknown'}`,
      }
    });

    return evidence;
  }

  async verifyHash(id: string, userId: string) {
    const evidence = await this.findById(id);
    if (!evidence.attachments || evidence.attachments.length === 0 || !evidence.hashes || evidence.hashes.length === 0) {
      return { status: 'N/A' };
    }

    const attachment = evidence.attachments[0];
    const storedHash = evidence.hashes[0].hashValue;
    
    const filePath = path.join(process.cwd(), attachment.filePath);
    
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      const fileBuffer = await fs.promises.readFile(filePath);
      const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      if (computedHash === storedHash) {
        return { status: 'VERIFIED' };
      } else {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'VERIFY_EVIDENCE_HASH',
            entityId: id,
            entityType: 'Evidence',
            description: `Integrity Failed: Hash mismatch for evidence ${evidence.evidenceNumber}`,
          }
        });
        return { status: 'FAILED' };
      }
    } catch (err) {
      // File does not exist or cannot be read
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'VERIFY_EVIDENCE_HASH',
          entityId: id,
          entityType: 'Evidence',
          description: `Integrity Failed: File missing or unreadable for evidence ${evidence.evidenceNumber}`,
        }
      });
      return { status: 'FAILED' };
    }
  }

  async update(id: string, updateEvidenceDto: UpdateEvidenceDto, userId: string, roleName?: string) {
    await this.findById(id); // Ensure exists

    if (updateEvidenceDto.evidenceNumber) {
      const existing = await this.prisma.evidence.findUnique({
        where: { evidenceNumber: updateEvidenceDto.evidenceNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Evidence number ${updateEvidenceDto.evidenceNumber} is already in use`);
      }
    }

    if (roleName === 'INVESTIGATOR') {
      const approval = await this.prisma.evidenceApproval.create({
        data: {
          evidenceId: id,
          requestedBy: userId,
          status: ApprovalStatus.PENDING,
          actionType: ApprovalActionType.EDIT,
          proposedData: {
            ...updateEvidenceDto,
            description: updateEvidenceDto.description ? encryptField(updateEvidenceDto.description) : undefined
          },
        }
      });
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'EDIT_REQUESTED',
          entityId: id,
          entityType: 'Evidence',
          description: `Requested edit for evidence ${id}`,
        }
      });
      return { status: 'PENDING_APPROVAL', message: 'Edit request submitted for approval', data: approval };
    }

    return this.prisma.$transaction(async (prisma) => {
      const dataToUpdate: any = { ...updateEvidenceDto };
      if (dataToUpdate.collectionDate) {
        dataToUpdate.collectionDate = new Date(dataToUpdate.collectionDate);
      }
      if (dataToUpdate.description) {
        dataToUpdate.description = encryptField(dataToUpdate.description) || undefined;
      }

      const updated = await prisma.evidence.update({
        where: { id },
        data: dataToUpdate,
        select: evidenceSelect,
      });

      if (updated.description) {
        updated.description = decryptField(updated.description) as string;
      }

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_EVIDENCE',
          entityId: id,
          entityType: 'Evidence',
          description: `Updated details for evidence ${updated.evidenceNumber}`,
        }
      });

      return updated;
    });
  }

  async getPendingApprovals(evidenceId: string) {
    return this.prisma.evidenceApproval.findMany({
      where: { evidenceId, status: ApprovalStatus.PENDING },
      include: { requestingUser: true },
    });
  }

  async approveEdit(approvalId: string, userId: string) {
    const approval = await this.prisma.evidenceApproval.findUnique({ where: { id: approvalId } });
    if (!approval || approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval request not found or not pending');
    }

    const proposedData = approval.proposedData as any;
    if (proposedData.collectionDate) {
      proposedData.collectionDate = new Date(proposedData.collectionDate);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedEvidence = await prisma.evidence.update({
        where: { id: approval.evidenceId },
        data: proposedData,
        select: evidenceSelect,
      });

      if (updatedEvidence.description) {
        updatedEvidence.description = decryptField(updatedEvidence.description) as string;
      }

      await prisma.evidenceApproval.update({
        where: { id: approvalId },
        data: { status: ApprovalStatus.APPROVED, approvedBy: userId }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EDIT_APPROVED',
          entityId: approval.evidenceId,
          entityType: 'Evidence',
          description: `Approved edit for evidence ${updatedEvidence.evidenceNumber}`,
        }
      });

      return { status: 'APPROVED', data: updatedEvidence };
    });
  }

  async rejectEdit(approvalId: string, userId: string) {
    const approval = await this.prisma.evidenceApproval.findUnique({ where: { id: approvalId } });
    if (!approval || approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval request not found or not pending');
    }

    await this.prisma.evidenceApproval.update({
      where: { id: approvalId },
      data: { status: ApprovalStatus.REJECTED, approvedBy: userId }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'EDIT_REJECTED',
        entityId: approval.evidenceId,
        entityType: 'Evidence',
        description: `Rejected edit for evidence ${approval.evidenceId}`,
      }
    });

    return { status: 'REJECTED' };
  }

  async delete(id: string, userId: string) {
    const evidence = await this.findById(id);

    const custodyCount = await this.prisma.custodyEvent.count({ where: { evidenceId: id } });
    if (custodyCount > 0) {
      throw new BadRequestException('Evidence cannot be deleted because custody history already exists.');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SOFT_DELETE_EVIDENCE',
          entityId: id,
          entityType: 'Evidence',
          description: `Soft deleted evidence with ID ${id}`,
        }
      });

      return prisma.evidence.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: evidenceSelect,
      });
    });
  }

  async decryptQr(payload: string) {
    const route = decryptRoute(payload);
    if (!route) {
      throw new BadRequestException('Invalid or malformed QR payload');
    }
    return { route };
  }
}
