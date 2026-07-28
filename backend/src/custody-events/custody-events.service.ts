import { createAuditLog } from '../audit-logs/utils/audit-logger';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { encryptField, decryptField } from '../common/utils/crypto.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';
import { custodyEventSelect } from './constants/custody-event-select';
import { CaseStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustodyEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkCaseStatusGate(caseId: string, action: 'HANDOVER', userId: string, override: boolean = false) {
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
  }

  async verifyIntegrityStrict(evidenceId: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { attachments: true, hashes: { orderBy: { generatedAt: 'desc' }, take: 1 } }
    });

    if (!evidence || !evidence.attachments || evidence.attachments.length === 0 || !evidence.hashes || evidence.hashes.length === 0) {
      return; // N/A
    }

    const attachment = evidence.attachments[0];
    const storedHash = evidence.hashes[0].hashValue;
    const filePath = path.join(process.cwd(), attachment.filePath);

    let status = 'FAILED';
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      const fileBuffer = await fs.promises.readFile(filePath);
      const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      status = computedHash === storedHash ? 'VERIFIED' : 'FAILED';
    } catch (err) {
      status = 'FAILED';
    }

    if (status === 'FAILED') {
      await createAuditLog(this.prisma, {
        data: {
          userId,
          action: 'INTEGRITY_ALERT',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `ALERT: Operation blocked due to SHA-256 integrity failure on evidence ID ${evidenceId}`,
        }
      });
      throw new ForbiddenException('Evidence integrity check failed. Operation blocked.');
    }
  }

  async create(createCustodyEventDto: CreateCustodyEventDto) {
    // Verify that the referenced Evidence exists and is not soft-deleted
    const evidence = await this.prisma.evidence.findFirst({
      where: { id: createCustodyEventDto.evidenceId, deletedAt: null },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${createCustodyEventDto.evidenceId} not found`);
    }

    let dataLocation = createCustodyEventDto.location;
    if (dataLocation) dataLocation = encryptField(dataLocation) as string;

    let dataNotes = createCustodyEventDto.notes;
    if (dataNotes) dataNotes = encryptField(dataNotes) || undefined;

    const eventData = {
      ...createCustodyEventDto,
      location: dataLocation,
      notes: dataNotes,
      eventTime: new Date(createCustodyEventDto.eventTime),
    };

    return this.prisma.$transaction(async (prisma) => {
      const newEvent = await prisma.custodyEvent.create({
        data: eventData,
        select: custodyEventSelect,
      });

      await createAuditLog(prisma, {
        data: {
          userId: createCustodyEventDto.actorId,
          action: 'ADD_CUSTODY_EVENT',
          entityId: newEvent.id,
          entityType: 'CustodyEvent',
          description: `Added ${createCustodyEventDto.action} custody event for evidence ${evidence.evidenceNumber}`,
        }
      });

      if (newEvent.location) newEvent.location = decryptField(newEvent.location) as string;
      if (newEvent.notes) newEvent.notes = decryptField(newEvent.notes) as string;

      return newEvent;
    });
  }

  private decryptEventFields(event: any) {
    if (event.location) event.location = decryptField(event.location) as string;
    if (event.notes) event.notes = decryptField(event.notes) as string;
    return event;
  }

  async findAll() {
    const events = await this.prisma.custodyEvent.findMany({
      select: custodyEventSelect,
      orderBy: { eventTime: 'asc' },
    });
    return events.map(e => this.decryptEventFields(e));
  }

  async findByEvidenceId(evidenceId: string) {
    const events = await this.prisma.custodyEvent.findMany({
      where: { evidenceId },
      select: custodyEventSelect,
      orderBy: { eventTime: 'asc' },
    });


    events.forEach(e => this.decryptEventFields(e));

    return events;
  }

  async dispatchHandover(evidenceId: string, recipientId: string, location: string, userId: string, override: boolean = false) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (evidence) {
      await this.verifyIntegrityStrict(evidenceId, userId);
      await this.checkCaseStatusGate(evidence.caseId, 'HANDOVER', userId, override);
    }

    const lastEvent = await this.prisma.custodyEvent.findFirst({
      where: { evidenceId },
      orderBy: { eventTime: 'desc' },
    });

    if (!lastEvent) {
      throw new BadRequestException('Evidence has no custody history');
    }
    const currentCustodianId = lastEvent.recipientId || lastEvent.actorId;
    if (currentCustodianId !== userId) {
      throw new BadRequestException('Only the current custodian can dispatch a handover');
    }

    if (lastEvent.action === 'HANDOVER_DISPATCH') {
      throw new BadRequestException('A handover is already pending');
    }

    return this.prisma.$transaction(async (prisma) => {
      let encLocation = location;
      if (encLocation) encLocation = encryptField(encLocation) as string;

      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'HANDOVER_DISPATCH',
          actorId: userId,
          recipientId,
          location: encLocation,
          eventTime: new Date(),
        },
        select: custodyEventSelect,
      });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'HANDOVER_DISPATCH',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `Dispatched handover of evidence ${evidenceId}`,
        }
      });

      if (event.location) event.location = decryptField(event.location) as string;
      return event;
    });
  }

  async externalTransfer(evidenceId: string, location: string, externalOrganization: string, externalRecipientName: string, signatureName: string, transferReason: string, userId: string, override: boolean = false) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (evidence) {
      await this.verifyIntegrityStrict(evidenceId, userId);
      await this.checkCaseStatusGate(evidence.caseId, 'HANDOVER', userId, override);
    }

    const lastEvent = await this.prisma.custodyEvent.findFirst({
      where: { evidenceId },
      orderBy: { eventTime: 'desc' },
    });

    if (!lastEvent) {
      throw new BadRequestException('Evidence has no custody history');
    }
    const currentCustodianId = lastEvent.recipientId || lastEvent.actorId;
    if (currentCustodianId !== userId) {
      throw new BadRequestException('Only the current custodian can initiate an external transfer');
    }

    if (lastEvent.action === 'HANDOVER_DISPATCH') {
      throw new BadRequestException('A handover is already pending, cannot perform external transfer');
    }

    if (lastEvent.action === 'COURT_SUBMISSION') {
      throw new BadRequestException('Evidence is currently in court and cannot be transferred externally');
    }

    if (!externalOrganization || !externalRecipientName) {
      throw new BadRequestException('External transfer requires recipient and organization details');
    }

    return this.prisma.$transaction(async (prisma) => {
      let encLocation = location;
      if (encLocation) encLocation = encryptField(encLocation) as string;

      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'EXTERNAL_TRANSFER',
          actorId: userId,
          location: encLocation,
          eventTime: new Date(),
          externalOrganization,
          externalRecipientName,
          signatureName,
          transferReason,
        },
        select: custodyEventSelect,
      });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'EXTERNAL_TRANSFER',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `Transferred evidence ${evidenceId} to external organization: ${externalOrganization}`,
        }
      });

      if (event.location) event.location = decryptField(event.location) as string;
      return event;
    });
  }

  async acceptHandover(evidenceId: string, location: string, userId: string, override: boolean = false) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (evidence) {
      await this.verifyIntegrityStrict(evidenceId, userId);
      await this.checkCaseStatusGate(evidence.caseId, 'HANDOVER', userId, override);
    }

    const lastEvent = await this.prisma.custodyEvent.findFirst({
      where: { evidenceId },
      orderBy: { eventTime: 'desc' },
    });

    if (!lastEvent || lastEvent.action !== 'HANDOVER_DISPATCH') {
      throw new BadRequestException('No pending handover to accept');
    }

    if (lastEvent.recipientId !== userId) {
      throw new BadRequestException('You are not the intended recipient of this handover');
    }

    return this.prisma.$transaction(async (prisma) => {
      let encLocation = location || lastEvent.location;
      if (location) {
        encLocation = encryptField(location) as string;
      } // if using lastEvent.location, it's already encrypted in db. Wait, we fetched lastEvent and it wasn't decrypted!
      // I should decrypt lastEvent fields if used, or just use it as is if we want it encrypted.
      // Actually, since lastEvent.location is encrypted in DB, we can just pass it directly if location is not provided!
      // But if location IS provided, encrypt it.
      if (location) {
        encLocation = encryptField(location) as string;
      }

      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'HANDOVER_ACK',
          actorId: userId,
          location: encLocation,
          eventTime: new Date(),
        },
        select: custodyEventSelect,
      });

      const latestHash = await prisma.evidenceHash.findFirst({ where: { evidenceId }, orderBy: { generatedAt: 'desc' } });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'HANDOVER_ACCEPTED',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `Accepted handover of evidence ${evidenceId}`,
          previousHash: latestHash?.hashValue,
          newHash: latestHash?.hashValue,
        }
      });

      if (event.location) event.location = decryptField(event.location) as string;
      return event;
    });
  }

  async rejectHandover(evidenceId: string, userId: string, override: boolean = false) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (evidence) {
      await this.verifyIntegrityStrict(evidenceId, userId);
      await this.checkCaseStatusGate(evidence.caseId, 'HANDOVER', userId, override);
    }

    const lastEvent = await this.prisma.custodyEvent.findFirst({
      where: { evidenceId },
      orderBy: { eventTime: 'desc' },
    });

    if (!lastEvent || lastEvent.action !== 'HANDOVER_DISPATCH') {
      throw new BadRequestException('No pending handover to reject');
    }

    if (lastEvent.recipientId !== userId) {
      throw new BadRequestException('You are not the intended recipient of this handover');
    }

    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'RETURNED',
          actorId: userId,
          recipientId: lastEvent.actorId,
          location: lastEvent.location,
          eventTime: new Date(),
          notes: encryptField('Handover rejected by recipient'),
        },
        select: custodyEventSelect,
      });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'HANDOVER_REJECTED',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `Rejected handover of evidence ${evidenceId}`,
        }
      });
      if (event.location) event.location = decryptField(event.location) as string;
      if (event.notes) event.notes = decryptField(event.notes) as string;
      return event;
    });
  }

  async findById(id: string) {
    const event = await this.prisma.custodyEvent.findUnique({
      where: { id },
      select: custodyEventSelect,
    });

    if (!event) {
      throw new NotFoundException(`Custody Event with ID ${id} not found`);
    }
    return this.decryptEventFields(event);
  }

  async delete(id: string) {
    await this.findById(id); // Ensure event exists

    // CustodyEvent schema does not support soft delete (no deletedAt field)
    // We execute a physical delete as instructed by fallback logic
    return this.prisma.custodyEvent.delete({
      where: { id },
      select: custodyEventSelect,
    });
  }
}
