import { createAuditLog } from '../audit-logs/utils/audit-logger';
import { ForbiddenException, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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

  async checkCaseStatusGate(caseId: string, action: 'CREATE' | 'EDIT' | 'DELETE' | 'HANDOVER', userId: string, override: boolean = false) {
    const relatedCase = await this.prisma.case.findUnique({
      where: { id: caseId, deletedAt: null },
      select: { status: true, caseNumber: true }
    });

    if (!relatedCase) {
      throw new NotFoundException(`Case not found or deleted`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    const { status } = relatedCase;

    if (status === CaseStatus.ARCHIVED) {
      throw new ForbiddenException(`Case ${relatedCase.caseNumber} is ARCHIVED. Evidence operations are locked.`);
    }

    if (status === CaseStatus.IN_COURT) {
      if (user?.role?.name === 'SUPER_ADMIN' && override) {
        await createAuditLog(this.prisma, {
          data: {
            userId: user.id,
            action: 'COURT_OVERRIDE',
            entityId: caseId,
            entityType: 'Case',
            description: `Super Admin overridden court lock for ${action} on Case ${relatedCase.caseNumber}`,
          }
        });
        return; // Proceed
      }
      throw new ForbiddenException(`Case ${relatedCase.caseNumber} is IN_COURT. Evidence operations are locked.`);
    }

    if (status === CaseStatus.SUBMITTED_TO_PROSECUTION) {
      throw new ForbiddenException(`Case ${relatedCase.caseNumber} is SUBMITTED_TO_PROSECUTION. Evidence is read-only.`);
    }

    if (status === CaseStatus.PENDING_REVIEW) {
      if (action === 'CREATE' || action === 'DELETE') {
        throw new ForbiddenException(`Case ${relatedCase.caseNumber} is PENDING_REVIEW. Cannot create or delete evidence.`);
      }
    }
  }

  async create(createEvidenceDto: CreateEvidenceDto, userId: string, file?: Express.Multer.File) {
    // BR-020: Evidence cannot be added unless case status is OPEN
    const relatedCase = await this.prisma.case.findUnique({
      where: { id: createEvidenceDto.caseId },
    });

    if (!relatedCase || relatedCase.deletedAt) {
      throw new NotFoundException(`Case with ID ${createEvidenceDto.caseId} not found`);
    }

    await this.checkCaseStatusGate(createEvidenceDto.caseId, 'CREATE', userId, false);

    const existingEvidence = await this.prisma.evidence.findUnique({
      where: { evidenceNumber: createEvidenceDto.evidenceNumber },
    });

    if (existingEvidence) {
      throw new ConflictException(`Evidence with number ${createEvidenceDto.evidenceNumber} already exists`);
    }

    return this.prisma.$transaction(async (prisma) => {
      let dataDescription = createEvidenceDto.description;
      if (dataDescription) dataDescription = encryptField(dataDescription) || undefined;
      
      let dataTitle = createEvidenceDto.title;
      if (dataTitle) dataTitle = encryptField(dataTitle) as string;

      let dataCollectionLoc = createEvidenceDto.collectionLocation;
      if (dataCollectionLoc) dataCollectionLoc = encryptField(dataCollectionLoc) as string;

      let dataStorageLoc = createEvidenceDto.storageLocation;
      if (dataStorageLoc) dataStorageLoc = encryptField(dataStorageLoc) || undefined;

      const newEvidence = await prisma.evidence.create({
        data: {
          ...createEvidenceDto,
          title: dataTitle,
          collectionLocation: dataCollectionLoc,
          storageLocation: dataStorageLoc,
          description: dataDescription,
          status: createEvidenceDto.status || EvidenceStatus.SEIZED,
          collectionDate: new Date(createEvidenceDto.collectionDate),
        },
        select: evidenceSelect,
      });

      await createAuditLog(prisma, {
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

        await createAuditLog(prisma, {
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

      await createAuditLog(prisma, {
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
      if (ev) {
        if (ev.description) ev.description = decryptField(ev.description) as string;
        if (ev.title) ev.title = decryptField(ev.title) as string;
        if (ev.collectionLocation) ev.collectionLocation = decryptField(ev.collectionLocation) as string;
        if (ev.storageLocation) ev.storageLocation = decryptField(ev.storageLocation) as string;
      }
      return ev;
    });
  }

  async findAll(user?: { id: string; role?: { name: string } }, caseId?: string) {
    const whereClause: any = { deletedAt: null };
    
    if (caseId) {
      whereClause.caseId = caseId;
    }

    if (user && (user.role?.name === 'INVESTIGATOR' || user.role?.name === 'ADMIN')) {
      whereClause.case = {
        assignments: {
          some: { userId: user.id },
        },
      };
    }

    const evidences = await this.prisma.evidence.findMany({
      where: whereClause,
      select: evidenceSelect,
      orderBy: { createdAt: 'desc' },
    });

    return evidences.map(ev => {
      if (ev.description) ev.description = decryptField(ev.description) as string;
      if (ev.title) ev.title = decryptField(ev.title) as string;
      if (ev.collectionLocation) ev.collectionLocation = decryptField(ev.collectionLocation) as string;
      if (ev.storageLocation) ev.storageLocation = decryptField(ev.storageLocation) as string;
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
    if (evidence.title) {
      evidence.title = decryptField(evidence.title) as string;
    }
    if (evidence.collectionLocation) {
      evidence.collectionLocation = decryptField(evidence.collectionLocation) as string;
    }
    if (evidence.storageLocation) {
      evidence.storageLocation = decryptField(evidence.storageLocation) as string;
    }

    return evidence;
  }

  async findByIdWithAudit(id: string, userId: string, ip?: string) {
    const evidence = await this.findById(id);

    // Record the VIEW_EVIDENCE action in the audit log
    await createAuditLog(this.prisma, {
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
        await createAuditLog(this.prisma, {
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
      await createAuditLog(this.prisma, {
        data: {
          userId,
          action: 'VERIFY_EVIDENCE_HASH',
          entityId: id,
          entityType: 'Evidence',
          description: `Integrity Failed: File not found or unreadable for evidence ${evidence.evidenceNumber}`,
        }
      });
      return { status: 'FAILED' };
    }
  }

  async verifyIntegrityStrict(id: string, userId: string) {
    const result = await this.verifyHash(id, userId);
    if (result.status === 'FAILED') {
      await createAuditLog(this.prisma, {
        data: {
          userId,
          action: 'INTEGRITY_ALERT',
          entityId: id,
          entityType: 'Evidence',
          description: `ALERT: Operation blocked due to SHA-256 integrity failure on evidence ID ${id}`,
        }
      });
      throw new ForbiddenException('Evidence integrity check failed. Operation blocked.');
    }
  }

  async verifyAll(userId: string) {
    const evidences = await this.prisma.evidence.findMany({
      where: { deletedAt: null },
      select: { id: true, evidenceNumber: true }
    });

    let verified = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const ev of evidences) {
      const res = await this.verifyHash(ev.id, userId);
      if (res.status === 'VERIFIED') {
        verified++;
      } else if (res.status === 'FAILED') {
        failed++;
        failedIds.push(ev.evidenceNumber);
      }
    }

    await createAuditLog(this.prisma, {
      data: {
        userId,
        action: 'VERIFY_ALL_EVIDENCE',
        description: `Ran bulk integrity verification. Total: ${evidences.length}, Verified: ${verified}, Failed: ${failed}`,
      }
    });

    return {
      total: evidences.length,
      verified,
      failed,
      failedIds
    };
  }

  async update(id: string, updateEvidenceDto: UpdateEvidenceDto, userId: string, roleName?: string, override: boolean = false) {
    const evidence = await this.findById(id); // Ensure exists
    await this.verifyIntegrityStrict(id, userId);
    await this.checkCaseStatusGate(evidence.caseId, 'EDIT', userId, override);

    if (updateEvidenceDto.evidenceNumber) {
      const existing = await this.prisma.evidence.findUnique({
        where: { evidenceNumber: updateEvidenceDto.evidenceNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Evidence number ${updateEvidenceDto.evidenceNumber} is already in use`);
      }
    }

    if (updateEvidenceDto.parentId) {
      if (updateEvidenceDto.parentId === id) {
        throw new BadRequestException('Evidence cannot be its own parent');
      }
      let currentParentId: string | null = updateEvidenceDto.parentId;
      while (currentParentId) {
        const parent = await this.prisma.evidence.findUnique({ where: { id: currentParentId }, select: { parentId: true } });
        if (!parent) break;
        if (parent.parentId === id) {
          throw new BadRequestException('Circular hierarchy detected: parent is a descendant of this evidence');
        }
        currentParentId = parent.parentId;
      }
    }

    if (roleName === 'INVESTIGATOR') {
      const approval = await this.prisma.evidenceApproval.create({
        data: {
          evidenceId: id,
          requestedBy: userId,
          status: ApprovalStatus.PENDING,
          actionType: ApprovalActionType.EDIT,
          proposedData: JSON.stringify({
            ...updateEvidenceDto,
            description: updateEvidenceDto.description ? encryptField(updateEvidenceDto.description) : undefined,
            title: updateEvidenceDto.title ? encryptField(updateEvidenceDto.title) : undefined,
            collectionLocation: updateEvidenceDto.collectionLocation ? encryptField(updateEvidenceDto.collectionLocation) : undefined,
            storageLocation: updateEvidenceDto.storageLocation !== undefined ? (updateEvidenceDto.storageLocation ? encryptField(updateEvidenceDto.storageLocation) : null) : undefined,
          }),
        }
      });
      await createAuditLog(this.prisma, {
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
      if (dataToUpdate.description) dataToUpdate.description = encryptField(dataToUpdate.description) || undefined;
      if (dataToUpdate.title) dataToUpdate.title = encryptField(dataToUpdate.title) as string;
      if (dataToUpdate.collectionLocation) dataToUpdate.collectionLocation = encryptField(dataToUpdate.collectionLocation) as string;
      if (dataToUpdate.storageLocation !== undefined) {
        dataToUpdate.storageLocation = dataToUpdate.storageLocation ? encryptField(dataToUpdate.storageLocation) : null;
      }

      // Check if physical storage fields changed
      const storageFieldsChanged = (
        (dataToUpdate.storageBuilding !== undefined && dataToUpdate.storageBuilding !== evidence.storageBuilding) ||
        (dataToUpdate.storageRoom !== undefined && dataToUpdate.storageRoom !== evidence.storageRoom) ||
        (dataToUpdate.storageCabinet !== undefined && dataToUpdate.storageCabinet !== evidence.storageCabinet) ||
        (dataToUpdate.storageShelf !== undefined && dataToUpdate.storageShelf !== evidence.storageShelf) ||
        (dataToUpdate.storageLocker !== undefined && dataToUpdate.storageLocker !== evidence.storageLocker)
      );

      const updated = await prisma.evidence.update({
        where: { id },
        data: dataToUpdate,
        select: evidenceSelect,
      });

      if (updated.description) updated.description = decryptField(updated.description) as string;
      if (updated.title) updated.title = decryptField(updated.title) as string;
      if (updated.collectionLocation) updated.collectionLocation = decryptField(updated.collectionLocation) as string;
      if (updated.storageLocation) updated.storageLocation = decryptField(updated.storageLocation) as string;

      const latestHash = await prisma.evidenceHash.findFirst({ where: { evidenceId: id }, orderBy: { generatedAt: 'desc' } });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'UPDATE_EVIDENCE',
          entityId: id,
          entityType: 'Evidence',
          description: `Updated details for evidence ${updated.evidenceNumber}`,
          previousHash: latestHash?.hashValue,
          newHash: latestHash?.hashValue,
        }
      });

      if (storageFieldsChanged) {
        await createAuditLog(prisma, {
          data: {
            userId,
            action: 'STORAGE_MOVEMENT',
            entityId: id,
            entityType: 'Evidence',
            description: `Physical storage location updated for evidence ${updated.evidenceNumber}`,
          }
        });
      }

      return updated;
    });
  }

  async getPendingApprovals(evidenceId: string) {
    return this.prisma.evidenceApproval.findMany({
      where: { evidenceId, status: ApprovalStatus.PENDING },
      include: { requestingUser: true },
    });
  }

  async approveEdit(approvalId: string, userId: string, override: boolean = false) {
    const approval = await this.prisma.evidenceApproval.findUnique({ where: { id: approvalId }, include: { evidence: true } });
    if (!approval || approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Approval request not found or not pending');
    }
    
    await this.verifyIntegrityStrict(approval.evidence.id, userId);
    await this.checkCaseStatusGate(approval.evidence.caseId, 'EDIT', userId, override);

    let proposedData = approval.proposedData as any;
    if (typeof proposedData === 'string') {
      proposedData = JSON.parse(proposedData);
    }
    if (proposedData.collectionDate) {
      proposedData.collectionDate = new Date(proposedData.collectionDate);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedEvidence = await prisma.evidence.update({
        where: { id: approval.evidenceId },
        data: proposedData,
        select: evidenceSelect,
      });

      if (updatedEvidence.description) updatedEvidence.description = decryptField(updatedEvidence.description) as string;
      if (updatedEvidence.title) updatedEvidence.title = decryptField(updatedEvidence.title) as string;
      if (updatedEvidence.collectionLocation) updatedEvidence.collectionLocation = decryptField(updatedEvidence.collectionLocation) as string;
      if (updatedEvidence.storageLocation) updatedEvidence.storageLocation = decryptField(updatedEvidence.storageLocation) as string;

      await prisma.evidenceApproval.update({
        where: { id: approvalId },
        data: { status: ApprovalStatus.APPROVED, approvedBy: userId }
      });

      const latestHash = await prisma.evidenceHash.findFirst({ where: { evidenceId: approval.evidenceId }, orderBy: { generatedAt: 'desc' } });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'EDIT_APPROVED',
          entityId: approval.evidenceId,
          entityType: 'Evidence',
          description: `Approved edit request ${approval.id} for evidence ${updatedEvidence.evidenceNumber}`,
          previousHash: latestHash?.hashValue,
          newHash: latestHash?.hashValue,
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

    await createAuditLog(this.prisma, {
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

  async delete(id: string, userId: string, override: boolean = false) {
    const evidence = await this.findById(id);
    await this.checkCaseStatusGate(evidence.caseId, 'DELETE', userId, override);

    const custodyCount = await this.prisma.custodyEvent.count({ where: { evidenceId: id } });
    if (custodyCount > 0) {
      throw new BadRequestException('Evidence cannot be deleted because custody history already exists.');
    }

    return this.prisma.$transaction(async (prisma) => {
      await createAuditLog(prisma, {
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
