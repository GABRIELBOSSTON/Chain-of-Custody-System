import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { caseSelect } from '../cases/constants/case-select';
import { evidenceSelect } from '../evidences/constants/evidence-select';
import { custodyEventSelect } from '../custody-events/constants/custody-event-select';
import { auditLogSelect } from '../audit-logs/constants/audit-log-select';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getCaseScope(user?: { id: string; role?: { name: string } }) {
    if (user && (user.role?.name === 'ADMIN' || user.role?.name === 'INVESTIGATOR')) {
      return { assignments: { some: { userId: user.id } } };
    }
    return {};
  }

  async getSummary(user?: { id: string; role?: { name: string } }) {
    const caseScope = this.getCaseScope(user);
    const caseWhere = { deletedAt: null, ...caseScope };
    const evWhere = { deletedAt: null, case: caseScope };
    const custodyWhere = { evidence: { case: caseScope } };

    const [
      totalCases, 
      totalEvidence, 
      totalCustodyEvents, 
      totalUsers,
      totalAuditLogs,
      casesByStatus,
      evidenceByCategory,
      recentEvidence,
      recentCustodyEvents,
      recentAuditLogs
    ] = await Promise.all([
      this.prisma.case.count({ where: caseWhere }),
      this.prisma.evidence.count({ where: evWhere }),
      this.prisma.custodyEvent.count({ where: custodyWhere }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.auditLog.count(),
      this.prisma.case.groupBy({ by: ['status'], where: caseWhere, _count: { id: true } }),
      this.prisma.evidence.groupBy({ by: ['category'], where: evWhere, _count: { id: true } }),
      this.prisma.evidence.findMany({ where: evWhere, orderBy: { createdAt: 'desc' }, take: 5, select: evidenceSelect }),
      this.prisma.custodyEvent.findMany({ where: custodyWhere, orderBy: { eventTime: 'desc' }, take: 5, select: custodyEventSelect }),
      this.prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 5, select: auditLogSelect })
    ]);

    const pendingHandoversCount = await this.prisma.custodyEvent.count({
      where: { action: 'HANDOVER_DISPATCH', ...custodyWhere }
    });
    const overdueHandoversCount = await this.prisma.custodyEvent.count({
      where: { action: 'HANDOVER_DISPATCH', isOverdue: true, ...custodyWhere }
    });

    return {
      totals: {
        cases: totalCases,
        evidence: totalEvidence,
        custodyEvents: totalCustodyEvents,
        users: totalUsers,
        auditLogs: totalAuditLogs,
        pendingHandovers: pendingHandoversCount,
        overdueHandovers: overdueHandoversCount
      },
      charts: {
        casesByStatus,
        evidenceByCategory
      },
      recent: {
        evidence: recentEvidence,
        custodyEvents: recentCustodyEvents,
        auditLogs: recentAuditLogs
      }
    };
  }

  async getActiveCases(user?: { id: string; role?: { name: string } }, startDate?: string, endDate?: string) {
    const caseScope = this.getCaseScope(user);
    const where: any = { deletedAt: null, ...caseScope };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    return this.prisma.case.findMany({
      where,
      select: caseSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveEvidence(user?: { id: string; role?: { name: string } }, startDate?: string, endDate?: string, caseId?: string) {
    const caseScope = this.getCaseScope(user);
    const where: any = { deletedAt: null, case: caseScope };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (caseId) {
      where.caseId = caseId;
      delete where.case; // we trust the explicit caseId filter over the scope object if provided, wait no, we should combine them!
      where.case = { id: caseId, ...caseScope };
    }

    const evidences = await this.prisma.evidence.findMany({
      where,
      select: evidenceSelect,
      orderBy: { createdAt: 'desc' },
    });

    const results = await Promise.all(evidences.map(async (ev) => {
      let hashVerificationStatus = 'N/A';
      if ((ev as any).attachments?.[0] && (ev as any).hashes?.[0]) {
        const attachment = (ev as any).attachments[0];
        const storedHash = (ev as any).hashes[0].hashValue;
        const filePath = path.join(process.cwd(), attachment.filePath);
        
        try {
          await fs.promises.access(filePath, fs.constants.F_OK);
          const fileBuffer = await fs.promises.readFile(filePath);
          const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          hashVerificationStatus = computedHash === storedHash ? 'VERIFIED' : 'FAILED';
        } catch (err) {
          hashVerificationStatus = 'FAILED';
        }
      }
      return { ...ev, hashVerificationStatus };
    }));

    return results;
  }

  async getCustodyEvents(user?: { id: string; role?: { name: string } }, startDate?: string, endDate?: string, caseId?: string, evidenceId?: string) {
    const caseScope = this.getCaseScope(user);
    const where: any = { evidence: { case: caseScope } };
    if (startDate) where.eventTime = { ...where.eventTime, gte: new Date(startDate) };
    if (endDate) where.eventTime = { ...where.eventTime, lte: new Date(endDate) };
    if (evidenceId) {
      where.evidenceId = evidenceId;
      where.evidence = { id: evidenceId, case: caseScope };
    }
    if (caseId) {
      where.evidence = { ...where.evidence, caseId, case: { id: caseId, ...caseScope } };
    }

    return this.prisma.custodyEvent.findMany({
      where,
      select: custodyEventSelect,
      orderBy: { eventTime: 'desc' },
    });
  }

  async getAuditLogs(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.timestamp = { ...where.timestamp, gte: new Date(startDate) };
    if (endDate) where.timestamp = { ...where.timestamp, lte: new Date(endDate) };

    return this.prisma.auditLog.findMany({
      where,
      select: auditLogSelect,
      orderBy: { timestamp: 'desc' },
    });
  }
}
