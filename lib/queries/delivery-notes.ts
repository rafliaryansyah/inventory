import { prisma } from "@/lib/prisma";

/** Delivery Note list for the left rail (PLAN §8.2). */
export async function getDeliveryNotes() {
  return prisma.deliveryNote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      recipient: { select: { id: true, name: true, division: true } },
      request: { select: { requestNumber: true } },
      items: { select: { id: true } },
    },
  });
}

/** Full printable Delivery Note document. */
export async function getDeliveryNoteDetail(id: string) {
  return prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      recipient: {
        select: { id: true, name: true, division: true, email: true },
      },
      creator: { select: { name: true, division: true } },
      request: {
        select: { requestNumber: true, reason: true, neededDate: true },
      },
      items: {
        include: {
          asset: {
            include: { category: { select: { name: true } } },
          },
        },
      },
    },
  });
}

export type DeliveryNoteDetail = NonNullable<
  Awaited<ReturnType<typeof getDeliveryNoteDetail>>
>;
