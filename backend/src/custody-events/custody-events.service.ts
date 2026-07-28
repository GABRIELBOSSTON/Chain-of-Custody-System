import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { encryptField, decryptField } from '../common/utils/crypto.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';
import { custodyEventSelect } from './constants/custody-event-select';

@Injectable()
export class CustodyEventsService {
  constructor(private readonly prisma: PrismaService) {}

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

      await prisma.auditLog.create({
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

  async dispatchHandover(evidenceId: string, recipientId: string, location: string, userId: string) {
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

      await prisma.auditLog.create({
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

  async acceptHandover(evidenceId: string, location: string, userId: string) {
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

      await prisma.auditLog.create({
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

  async rejectHandover(evidenceId: string, userId: string) {
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

      await prisma.auditLog.create({
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
