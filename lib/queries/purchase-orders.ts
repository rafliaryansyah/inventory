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

/** Full PO detail with line items (harga & link) for the detail modal. */
export async function getPurchaseOrderDetail(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!po) return null;
  return {
    ...po,
    totalCost: Number(po.totalCost),
    items: po.items.map((it) => ({
      id: it.id,
      itemName: it.itemName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      buyLink: it.buyLink,
    })),
  };
}

export type PurchaseOrderDetail = NonNullable<
  Awaited<ReturnType<typeof getPurchaseOrderDetail>>
>;

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
