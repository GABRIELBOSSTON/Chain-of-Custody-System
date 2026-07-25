import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { caseSelect } from '../cases/constants/case-select';
import { evidenceSelect } from '../evidence/constants/evidence-select';
import { custodyEventSelect } from '../custody-events/constants/custody-event-select';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    // Utilize Promise.all to run aggregate queries concurrently
    const [totalCases, totalEvidence, totalCustodyEvents, totalUsers] = await Promise.all([
      this.prisma.case.count({ where: { deletedAt: null } }),
      this.prisma.evidence.count({ where: { deletedAt: null } }),
      this.prisma.custodyEvent.count(),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    ]);

    return {
      totalCases,
      totalEvidence,
      totalCustodyEvents,
      totalUsers,
    };
  }

  async getActiveCases() {
    return this.prisma.case.findMany({
      where: { deletedAt: null },
      select: caseSelect,
    });
  }

  async getActiveEvidence() {
    return this.prisma.evidence.findMany({
      where: { deletedAt: null },
      select: evidenceSelect,
    });
  }

  async getCustodyEvents() {
    return this.prisma.custodyEvent.findMany({
      select: custodyEventSelect,
      orderBy: { eventTime: 'desc' },
    });
  }
}
