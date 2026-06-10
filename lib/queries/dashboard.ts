import { prisma } from "@/lib/prisma";

/** Karyawan dashboard metrics + activity (PLAN §8.1). */
export async function getKaryawanDashboard(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeCount, myAssetsCount, monthCount, recentRequests, myAssets] =
    await Promise.all([
      prisma.assetRequest.count({
        where: {
          requesterId: userId,
          status: {
            in: ["PENDING_APPROVAL", "APPROVED", "PROCESSING", "READY_TO_SIGN"],
          },
        },
      }),
      prisma.asset.count({ where: { assignedToId: userId } }),
      prisma.assetRequest.count({
        where: { requesterId: userId, createdAt: { gte: monthStart } },
      }),
      prisma.assetRequest.findMany({
        where: { requesterId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { select: { itemName: true, quantity: true } } },
      }),
      prisma.asset.findMany({
        where: { assignedToId: userId },
        orderBy: { updatedAt: "desc" },
        include: { category: { select: { name: true } } },
      }),
    ]);

  return { activeCount, myAssetsCount, monthCount, recentRequests, myAssets };
}
