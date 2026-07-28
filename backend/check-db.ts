import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const evidences = await prisma.evidence.findMany({
    include: {
      case: true
    }
  });
  
  console.log(`Found ${evidences.length} evidences in DB.`);
  for (const ev of evidences) {
    console.log(`Evidence ${ev.evidenceNumber} belongs to Case ${ev.case.caseNumber} which has status: ${ev.case.status}`);
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  console.log('\nRecent Audit Logs:');
  for (const log of logs) {
    console.log(`[${log.timestamp}] Action: ${log.action} on ${log.entityType} (${log.entityId})`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
