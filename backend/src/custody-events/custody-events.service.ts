import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.custodyEvent.create({
      data: eventData,
      select: custodyEventSelect,
    });
  }

  async findAll() {
    return this.prisma.custodyEvent.findMany({
      select: custodyEventSelect,
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
