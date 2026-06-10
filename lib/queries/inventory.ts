import { prisma } from "@/lib/prisma";
import type { StockStatus } from "@prisma/client";

export type InventoryFilters = { search?: string; categoryId?: string };

export type InventoryRow = {
  id: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  status: StockStatus;
  unit: string;
  price: number;
};

/** Inventory list + summary metrics (PLAN §8.2). */
export async function getInventory(filters?: InventoryFilters) {
  const where: Record<string, unknown> = {};
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.search)
    where.itemName = { contains: filters.search, mode: "insensitive" };

  const rows = await prisma.inventory.findMany({
    where,
    orderBy: [{ category: { name: "asc" } }, { itemName: "asc" }],
    include: { category: { select: { name: true } } },
  });

  const items: InventoryRow[] = rows.map((r) => ({
    id: r.id,
    itemName: r.itemName,
    categoryId: r.categoryId,
    categoryName: r.category.name,
    currentStock: r.currentStock,
    minStock: r.minStock,
    status: r.status,
    unit: r.unit,
    price: Number(r.price),
  }));

  return items;
}

/** Inventory KPIs across the whole catalogue (not filtered). */
export async function getInventoryMetrics() {
  const all = await prisma.inventory.findMany({
    select: { currentStock: true, price: true, status: true },
  });
  const totalSku = all.length;
  const lowOrEmpty = all.filter(
    (i) => i.status === "LOW" || i.status === "EMPTY",
  ).length;
  const totalValue = all.reduce(
    (sum, i) => sum + i.currentStock * Number(i.price),
    0,
  );
  return { totalSku, lowOrEmpty, totalValue };
}

export async function getCategories() {
  return prisma.assetCategory.findMany({ orderBy: { name: "asc" } });
}
