import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    const eventData = {
      ...createCustodyEventDto,
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

      return newEvent;
    });
  }

  async findAll() {
    return this.prisma.custodyEvent.findMany({
      select: custodyEventSelect,
      orderBy: { eventTime: 'asc' },
    });
  }

  async findByEvidenceId(evidenceId: string) {
    const events = await this.prisma.custodyEvent.findMany({
      where: { evidenceId },
      select: custodyEventSelect,
      orderBy: { eventTime: 'asc' },
    });

    if (events.length > 0) {
      const latest = events[events.length - 1];
      if (latest.action === 'HANDOVER_DISPATCH') {
         const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
         if (new Date(latest.eventTime) < threeDaysAgo) {
            const existingLog = await this.prisma.auditLog.findFirst({
              where: { action: 'ESCALATION_TRIGGERED', entityId: evidenceId }
            });
            if (!existingLog) {
              await this.prisma.auditLog.create({
                data: {
                  action: 'ESCALATION_TRIGGERED',
                  entityId: evidenceId,
                  entityType: 'Evidence',
                  description: `Handover escalation triggered for evidence ${evidenceId}`,
                }
              });
            }
            (latest as any).isOverdue = true;
         }
      }
    }

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
      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'HANDOVER_DISPATCH',
          actorId: userId,
          recipientId,
          location,
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
      const event = await prisma.custodyEvent.create({
        data: {
          evidenceId,
          action: 'HANDOVER_ACK',
          actorId: userId,
          location: location || lastEvent.location,
          eventTime: new Date(),
        },
        select: custodyEventSelect,
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'HANDOVER_ACCEPTED',
          entityId: evidenceId,
          entityType: 'Evidence',
          description: `Accepted handover of evidence ${evidenceId}`,
        }
      });

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
          notes: 'Handover rejected by recipient',
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

      return event;
    });
  }

  async findById(id: string) {
    const event = await this.prisma.custodyEvent.findUnique({
      where: { id },
      select: custodyEventSelect,
    });

    if (!event) {
      throw new NotFoundException(`CustodyEvent with ID ${id} not found`);
    }

    return event;
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
