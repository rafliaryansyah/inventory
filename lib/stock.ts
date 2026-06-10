import type { StockStatus } from "@prisma/client";

/** Auto-derive inventory stock status (PLAN §8.2). */
export function computeStockStatus(
  currentStock: number,
  minStock: number,
): StockStatus {
  if (currentStock <= 0) return "EMPTY";
  if (currentStock < minStock) return "LOW";
  return "OK";
}
