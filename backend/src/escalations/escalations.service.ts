import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscalationsService {
  private readonly logger = new Logger(EscalationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleEscalations() {
    this.logger.log('Running daily background escalation check...');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingHandovers = await this.prisma.custodyEvent.findMany({
      where: {
        action: 'HANDOVER_DISPATCH',
        isOverdue: false,
        eventTime: { lt: threeDaysAgo },
      },
    });

    for (const handover of pendingHandovers) {
      await this.prisma.$transaction(async (prisma) => {
        // Mark as overdue
        await prisma.custodyEvent.update({
          where: { id: handover.id },
          data: { isOverdue: true },
        });

        // Ensure we only trigger one audit log for this event
        const existingLog = await prisma.auditLog.findFirst({
          where: {
            action: 'ESCALATION_TRIGGERED',
            entityId: handover.id,
          }
        });

        if (!existingLog) {
          await prisma.auditLog.create({
            data: {
              userId: null,
              action: 'ESCALATION_TRIGGERED',
              entityId: handover.id,
              entityType: 'CustodyEvent',
              description: `Escalated pending handover for evidence ${handover.evidenceId} because it exceeded the 3-day SLA.`,
            },
          });
        }
      });
      this.logger.log(`Escalated handover ${handover.id} for evidence ${handover.evidenceId}`);
    }

    this.logger.log(`Escalation check completed. Escalated ${pendingHandovers.length} handovers.`);
  }
}
