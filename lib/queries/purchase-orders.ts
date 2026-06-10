import { prisma } from "@/lib/prisma";

/** Purchase Order list (PLAN §8.2). */
export async function getPurchaseOrders() {
  const rows = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({
    ...p,
    totalCost: Number(p.totalCost),
  }));
}

export type PurchaseOrderRow = Awaited<
  ReturnType<typeof getPurchaseOrders>
>[number];

/** Low-stock items, surfaced as a callout in the "PO Baru" modal. */
export async function getLowStockItems() {
  const rows = await prisma.inventory.findMany({
    where: { status: { in: ["LOW", "EMPTY"] } },
    orderBy: { currentStock: "asc" },
    include: { category: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    itemName: r.itemName,
    categoryName: r.category.name,
    currentStock: r.currentStock,
    minStock: r.minStock,
    unit: r.unit,
    price: Number(r.price),
    status: r.status,
  }));
}
