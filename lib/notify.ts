import type { Prisma, PrismaClient, NotifType } from "@prisma/client";

type Client = PrismaClient | Prisma.TransactionClient;

export type NotifInput = {
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  entityId?: string | null;
};

export async function notify(client: Client, n: NotifInput): Promise<void> {
  await client.notification.create({
    data: {
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      entityId: n.entityId ?? null,
    },
  });
}

export async function notifyMany(
  client: Client,
  userIds: string[],
  n: Omit<NotifInput, "userId">,
): Promise<void> {
  if (userIds.length === 0) return;
  await client.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: n.type,
      title: n.title,
      message: n.message,
      entityId: n.entityId ?? null,
    })),
  });
}
