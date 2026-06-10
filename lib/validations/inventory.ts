import { z } from "zod";

export const adjustStockSchema = z.object({
  inventoryId: z.string().uuid(),
  delta: z.coerce.number().int(),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const createInventorySchema = z.object({
  categoryId: z.string().uuid("Kategori wajib dipilih"),
  itemName: z.string().trim().min(1, "Nama item wajib diisi"),
  currentStock: z.coerce.number().int().nonnegative("Stok tidak boleh negatif"),
  minStock: z.coerce.number().int().nonnegative("Min stok tidak boleh negatif"),
  unit: z.string().trim().min(1).default("pcs"),
  price: z.coerce.number().nonnegative("Harga tidak boleh negatif"),
});
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi"),
  description: z.string().trim().optional().nullable(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
