import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
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

  async verifyAuditChain() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' }
    });

    if (logs.length === 0) {
      return { status: 'VALID', message: 'Chain is empty', totalLogs: 0 };
    }

    let previousHash = 'GENESIS_HASH';
    const secret = process.env.ENCRYPTION_KEY || 'default-fallback-secret-key-32-byte';
    
    for (const log of logs) {
      if (log.previousHash !== previousHash) {
        return { 
          status: 'BROKEN', 
          message: `Hash chain broken at log ${log.id}. Expected previousHash: ${previousHash}, found: ${log.previousHash}`,
          brokenLogId: log.id 
        };
      }

      const payloadStr = JSON.stringify({
        userId: log.userId,
        action: log.action,
        entityId: log.entityId,
        entityType: log.entityType,
        description: log.description,
        previousHash
      });
      const expectedHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
      if (expectedHash !== log.newHash) {
        return {
          status: 'BROKEN',
          message: `Payload hash mismatch at log ${log.id}. Content has been tampered with.`,
          brokenLogId: log.id
        };
      }

      const expectedSignature = crypto.createHmac('sha256', secret).update(expectedHash).digest('hex');
      if (expectedSignature !== log.signature) {
        return {
          status: 'BROKEN',
          message: `HMAC signature mismatch at log ${log.id}. Signature is invalid.`,
          brokenLogId: log.id
        };
      }

      previousHash = log.newHash!;
    }

    return { status: 'VALID', message: 'Audit chain is fully verified.', totalLogs: logs.length };
  }
}
