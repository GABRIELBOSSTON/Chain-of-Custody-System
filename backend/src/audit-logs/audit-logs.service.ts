import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { auditLogSelect } from './constants/audit-log-select';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(searchQuery?: string) {
    const whereClause: any = {};

    if (searchQuery) {
      whereClause.OR = [
        { action: { contains: searchQuery } },
        { entityType: { contains: searchQuery } },
        {
          user: {
            OR: [
              { email: { contains: searchQuery } },
              { policeProfile: { fullName: { contains: searchQuery } } }
            ]
          }
        }
      ];
    }

    return this.prisma.auditLog.findMany({
      where: whereClause,
      select: auditLogSelect,
      orderBy: { timestamp: 'desc' },
    });
  }

  async findById(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      select: auditLogSelect,
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return log;
  }
}
