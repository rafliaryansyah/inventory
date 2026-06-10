import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  itemName: z.string().trim().min(1, "Nama item wajib diisi"),
  quantity: z.coerce.number().int().positive("Qty minimal 1"),
  unitPrice: z.coerce.number().nonnegative("Harga tidak boleh negatif"),
});

export const createPurchaseOrderSchema = z.object({
  supplier: z.string().trim().min(1, "Supplier wajib diisi"),
  expectedAt: z.coerce.date().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, "Minimal 1 item pengadaan"),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
