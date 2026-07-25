import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { caseSelect } from './constants/case-select';
import { CaseStatus } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCaseDto: CreateCaseDto) {
    const existingCase = await this.prisma.case.findUnique({
      where: { caseNumber: createCaseDto.caseNumber },
    });

    if (existingCase) {
      throw new ConflictException(`Case with number ${createCaseDto.caseNumber} already exists`);
    }

    const data = {
      ...createCaseDto,
      status: createCaseDto.status || CaseStatus.OPEN,
    };

    return this.prisma.case.create({
      data,
      select: caseSelect,
    });
  }

  async findAll() {
    return this.prisma.case.findMany({
      where: { deletedAt: null },
      select: caseSelect,
    });
  }

  async findById(id: string) {
    const caseRecord = await this.prisma.case.findFirst({
      where: { id, deletedAt: null },
      select: caseSelect,
    });

    if (!caseRecord) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return caseRecord;
  }

  async update(id: string, updateCaseDto: UpdateCaseDto) {
    await this.findById(id); // Ensure the case exists

    if (updateCaseDto.caseNumber) {
      const existingCase = await this.prisma.case.findUnique({
        where: { caseNumber: updateCaseDto.caseNumber },
      });

      if (existingCase && existingCase.id !== id) {
        throw new ConflictException(`Case with number ${updateCaseDto.caseNumber} already in use`);
      }
    }

    return this.prisma.case.update({
      where: { id },
      data: updateCaseDto,
      select: caseSelect,
    });
  }

  async delete(id: string) {
    await this.findById(id); // Ensure the case exists

    // Perform architectural soft deletion
    return this.prisma.case.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: caseSelect,
    });
  }
}
