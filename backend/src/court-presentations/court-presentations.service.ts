import { createAuditLog } from '../audit-logs/utils/audit-logger';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtPresentationDto } from './dto/create-court-presentation.dto';
import { ReturnCourtPresentationDto } from './dto/return-court-presentation.dto';
import { CustodyEventsService } from '../custody-events/custody-events.service';
import { CaseStatus } from '@prisma/client';

@Injectable()
export class CourtPresentationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custodyEventsService: CustodyEventsService
  ) {}

  async create(createDto: CreateCourtPresentationDto, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: createDto.evidenceId },
      include: { case: true }
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    if (evidence.case.status === CaseStatus.ARCHIVED) {
      throw new ForbiddenException('Cannot present evidence for an archived case');
    }

    // Prevent invalid court transitions
    const latestEvent = await this.prisma.custodyEvent.findFirst({
      where: { evidenceId: createDto.evidenceId },
      orderBy: { eventTime: 'desc' }
    });

    if (latestEvent && latestEvent.action === 'COURT_SUBMISSION') {
      throw new BadRequestException('Evidence is currently in court and cannot be transferred externally');
    }

    // Verify evidence integrity before presentation
    await this.custodyEventsService.verifyIntegrityStrict(createDto.evidenceId, userId);

    return this.prisma.$transaction(async (prisma) => {
      const presentation = await prisma.courtPresentation.create({
        data: {
          evidenceId: createDto.evidenceId,
          courtName: createDto.courtName,
          exhibitNumber: createDto.exhibitNumber,
          presentedDate: new Date(createDto.presentedDate),
          presentedBy: userId,
        }
      });

      // Automatically append Court Presentation event into Chain of Custody Timeline
      await prisma.custodyEvent.create({
        data: {
          evidenceId: createDto.evidenceId,
          action: 'COURT_SUBMISSION',
          actorId: userId,
          location: createDto.courtName,
          eventTime: new Date(createDto.presentedDate),
          notes: `Exhibit ${createDto.exhibitNumber} presented to ${createDto.courtName}`,
        }
      });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'COURT_PRESENTATION_CREATED',
          entityId: presentation.id,
          entityType: 'CourtPresentation',
          description: `Evidence ${createDto.evidenceId} presented as Exhibit ${createDto.exhibitNumber} in ${createDto.courtName}`,
        }
      });

      return presentation;
    });
  }

  async returnEvidence(id: string, returnDto: ReturnCourtPresentationDto, userId: string) {
    const presentation = await this.prisma.courtPresentation.findUnique({
      where: { id },
      include: { evidence: { include: { case: true } } }
    });

    if (!presentation) {
      throw new NotFoundException('Court presentation not found');
    }

    if (presentation.returnedDate) {
      throw new BadRequestException('This evidence has already been returned from court');
    }

    if (presentation.evidence.case.status === CaseStatus.ARCHIVED) {
      throw new ForbiddenException('Cannot update evidence for an archived case');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.courtPresentation.update({
        where: { id },
        data: {
          returnedDate: new Date(returnDto.returnedDate),
          returnedBy: userId,
        }
      });

      // Automatically append Court Return event into Chain of Custody Timeline
      await prisma.custodyEvent.create({
        data: {
          evidenceId: presentation.evidenceId,
          action: 'RETURNED',
          actorId: userId,
          location: 'Evidence Storage',
          eventTime: new Date(returnDto.returnedDate),
          notes: `Exhibit ${presentation.exhibitNumber} returned from ${presentation.courtName}`,
        }
      });

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'COURT_PRESENTATION_RETURNED',
          entityId: id,
          entityType: 'CourtPresentation',
          description: `Exhibit ${presentation.exhibitNumber} returned from ${presentation.courtName}`,
        }
      });

      return updated;
    });
  }
}
