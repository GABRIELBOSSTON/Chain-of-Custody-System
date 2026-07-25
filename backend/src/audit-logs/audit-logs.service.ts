import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { auditLogSelect } from './constants/audit-log-select';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.auditLog.findMany({
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
