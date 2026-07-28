import { createAuditLog } from '../audit-logs/utils/audit-logger';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { caseSelect } from './constants/case-select';
import { CaseStatus } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCaseDto: CreateCaseDto, userId: string, roleName?: string) {
    const existingCase = await this.prisma.case.findUnique({
      where: { caseNumber: createCaseDto.caseNumber },
    });

    if (existingCase) {
      throw new ConflictException(`Case with number ${createCaseDto.caseNumber} already exists`);
    }

    const initialStatus = createCaseDto.status || CaseStatus.OPEN;

    return this.prisma.$transaction(async (prisma) => {
      const newCase = await prisma.case.create({
        data: {
          ...createCaseDto,
          status: initialStatus,
        },
      });

      await prisma.caseStatusHistory.create({
        data: {
          caseId: newCase.id,
          status: initialStatus,
          changedBy: userId,
          changedAt: new Date(),
        },
      });

      let isInvestigator = roleName === 'INVESTIGATOR';
      if (!roleName) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        isInvestigator = user?.role?.name === 'INVESTIGATOR';
      }

      if (isInvestigator) {
        await prisma.caseAssignment.create({
          data: {
            caseId: newCase.id,
            userId,
            assignedAt: new Date(),
          },
        });
      }

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'CREATE_CASE',
          entityId: newCase.id,
          entityType: 'Case',
          description: `Created case with number ${newCase.caseNumber}`,
        }
      });

      return prisma.case.findUnique({
        where: { id: newCase.id },
        select: caseSelect,
      });
    });
  }

  async findAll(user?: { id: string; role?: { name: string } }) {
    const whereClause: any = { deletedAt: null };

    if (user && (user.role?.name === 'INVESTIGATOR' || user.role?.name === 'ADMIN')) {
      whereClause.assignments = {
        some: { userId: user.id },
      };
    }

    return this.prisma.case.findMany({
      where: whereClause,
      select: caseSelect,
      orderBy: { createdAt: 'desc' },
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

  async update(id: string, updateCaseDto: UpdateCaseDto, userId: string) {
    const existingCase = await this.findById(id);

    if (updateCaseDto.caseNumber) {
      const conflictCase = await this.prisma.case.findUnique({
        where: { caseNumber: updateCaseDto.caseNumber },
      });

      if (conflictCase && conflictCase.id !== id) {
        throw new ConflictException(`Case with number ${updateCaseDto.caseNumber} already in use`);
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedCase = await prisma.case.update({
        where: { id },
        data: updateCaseDto,
        select: caseSelect,
      });

      if (updateCaseDto.status && updateCaseDto.status !== existingCase.status) {
        await prisma.caseStatusHistory.create({
          data: {
            caseId: id,
            status: updateCaseDto.status,
            changedBy: userId,
            changedAt: new Date(),
          },
        });
      }

      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'UPDATE_CASE',
          entityId: id,
          entityType: 'Case',
          description: `Updated case details for ${updatedCase.caseNumber}`,
        }
      });

      return updatedCase;
    });
  }

  async delete(id: string, userId: string) {
    await this.findById(id);

    return this.prisma.$transaction(async (prisma) => {
      await createAuditLog(prisma, {
        data: {
          userId,
          action: 'SOFT_DELETE_CASE',
          entityId: id,
          entityType: 'Case',
          description: `Soft deleted case with ID ${id}`,
        }
      });

      return prisma.case.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: caseSelect,
      });
    });
  }
}
