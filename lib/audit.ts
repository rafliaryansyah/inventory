import type { Prisma, PrismaClient } from "@prisma/client";

type Client = PrismaClient | Prisma.TransactionClient;

export async function logAudit(
  client: Client,
  data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Prisma.InputJsonValue;
  },
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
    },
  });
}
