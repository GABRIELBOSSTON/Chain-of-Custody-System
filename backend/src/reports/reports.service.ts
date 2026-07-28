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

  async getSummary() {
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
      this.prisma.case.count({ where: { deletedAt: null } }),
      this.prisma.evidence.count({ where: { deletedAt: null } }),
      this.prisma.custodyEvent.count(),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.auditLog.count(),
      this.prisma.case.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { id: true } }),
      this.prisma.evidence.groupBy({ by: ['category'], where: { deletedAt: null }, _count: { id: true } }),
      this.prisma.evidence.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, select: evidenceSelect }),
      this.prisma.custodyEvent.findMany({ orderBy: { eventTime: 'desc' }, take: 5, select: custodyEventSelect }),
      this.prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 5, select: auditLogSelect })
    ]);

    // Process escalations and calculate handover stats
    const evidencesWithPending = await this.prisma.evidence.findMany({
      where: { deletedAt: null },
      include: {
        custodyEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1
        }
      }
    });

    let pendingHandoversCount = 0;
    let overdueHandoversCount = 0;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    for (const ev of evidencesWithPending) {
      if (ev.custodyEvents.length > 0) {
        const latestEvent = ev.custodyEvents[0];
        if (latestEvent.action === 'HANDOVER_DISPATCH') {
          pendingHandoversCount++;
          if (latestEvent.eventTime < threeDaysAgo) {
            overdueHandoversCount++;
            
            // Check if escalated log exists
            const existingLog = await this.prisma.auditLog.findFirst({
              where: { action: 'ESCALATION_TRIGGERED', entityId: ev.id }
            });
            if (!existingLog) {
              await this.prisma.auditLog.create({
                data: {
                  action: 'ESCALATION_TRIGGERED',
                  entityId: ev.id,
                  entityType: 'Evidence',
                  description: `Handover escalation triggered for evidence ${ev.evidenceNumber}`,
                }
              });
            }
          }
        }
      }
    }

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

  async getActiveCases(startDate?: string, endDate?: string) {
    const where: any = { deletedAt: null };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    return this.prisma.case.findMany({
      where,
      select: caseSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveEvidence(startDate?: string, endDate?: string, caseId?: string) {
    const where: any = { deletedAt: null };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (caseId) where.caseId = caseId;

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

  async getCustodyEvents(startDate?: string, endDate?: string, caseId?: string, evidenceId?: string) {
    const where: any = {};
    if (startDate) where.eventTime = { ...where.eventTime, gte: new Date(startDate) };
    if (endDate) where.eventTime = { ...where.eventTime, lte: new Date(endDate) };
    if (evidenceId) where.evidenceId = evidenceId;
    if (caseId) where.evidence = { caseId };

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
