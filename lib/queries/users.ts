import { prisma } from "@/lib/prisma";

/** Master Karyawan — daftar seluruh user + ringkasan jumlah. */
export async function getEmployees() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      division: true,
      avatarColor: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          assetsAssigned: true,
          dnReceived: true,
          requestsMade: true,
        },
      },
    },
  });
}

export type EmployeeRow = Awaited<ReturnType<typeof getEmployees>>[number];

/** Detail karyawan: profil + aset dipegang + riwayat serah terima + riwayat permintaan. */
export async function getEmployeeDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      division: true,
      avatarColor: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [assets, deliveryNotes, requests] = await Promise.all([
    prisma.asset.findMany({
      where: { assignedToId: id },
      orderBy: { assetCode: "asc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.deliveryNote.findMany({
      where: { recipientId: id, status: { in: ["SIGNED", "ARCHIVED"] } },
      orderBy: { signedAt: "desc" },
      include: {
        items: { include: { asset: { select: { assetCode: true, name: true } } } },
      },
    }),
    prisma.assetRequest.findMany({
      where: { requesterId: id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { itemName: true, quantity: true } } },
    }),
  ]);

  return { ...user, assets, deliveryNotes, requests };
}

export type EmployeeDetail = NonNullable<
  Awaited<ReturnType<typeof getEmployeeDetail>>
>;
