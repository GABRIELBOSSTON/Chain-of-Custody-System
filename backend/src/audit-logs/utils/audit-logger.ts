import * as crypto from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';

export async function createAuditLog(
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> | PrismaClient,
  args: Prisma.AuditLogCreateArgs
) {
  const data = args.data as Prisma.AuditLogUncheckedCreateInput;

  // Get the most recent log to link the hash chain
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
  });

  const previousHash = lastLog?.newHash || 'GENESIS_HASH';

  // Create a predictable string payload for the current entry
  const payloadStr = JSON.stringify({
    userId: data.userId || null,
    action: data.action,
    entityId: data.entityId || null,
    entityType: data.entityType || null,
    description: data.description || null,
    previousHash
  });

  const newHash = crypto.createHash('sha256').update(payloadStr).digest('hex');

  // Sign with HMAC-SHA256
  const secret = process.env.ENCRYPTION_KEY || 'default-fallback-secret-key-32-byte';
  const signature = crypto.createHmac('sha256', secret).update(newHash).digest('hex');

  return prisma.auditLog.create({
    ...args,
    data: {
      ...args.data,
      previousHash,
      newHash,
      signature
    }
  });
}
