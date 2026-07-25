import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { evidenceSelect } from './constants/evidence-select';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEvidenceDto: CreateEvidenceDto) {
    // Verify that the referenced Case exists and is not soft-deleted
    const caseRecord = await this.prisma.case.findFirst({
      where: { id: createEvidenceDto.caseId, deletedAt: null },
    });

    if (!caseRecord) {
      throw new NotFoundException(`Case with ID ${createEvidenceDto.caseId} not found`);
    }

    return this.prisma.evidence.create({
      data: createEvidenceDto,
      select: evidenceSelect,
    });
  }

  async findAll() {
    return this.prisma.evidence.findMany({
      where: { deletedAt: null },
      select: evidenceSelect,
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

    return evidence;
  }

  async update(id: string, updateEvidenceDto: UpdateEvidenceDto) {
    await this.findById(id); // Ensure evidence exists

    // If attempting to reassign the case, verify the new case exists
    if (updateEvidenceDto.caseId) {
      const caseRecord = await this.prisma.case.findFirst({
        where: { id: updateEvidenceDto.caseId, deletedAt: null },
      });

      if (!caseRecord) {
        throw new NotFoundException(`Case with ID ${updateEvidenceDto.caseId} not found`);
      }
    }

    return this.prisma.evidence.update({
      where: { id },
      data: updateEvidenceDto,
      select: evidenceSelect,
    });
  }

  async delete(id: string) {
    await this.findById(id); // Ensure evidence exists

    // Execute architectural soft deletion
    return this.prisma.evidence.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: evidenceSelect,
    });
  }
}
