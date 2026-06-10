import { z } from "zod";

export const registerAssetSchema = z.object({
  name: z.string().trim().min(1, "Nama aset wajib diisi"),
  categoryId: z.string().uuid("Kategori wajib dipilih"),
  status: z
    .enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "DAMAGED", "RETIRED"])
    .default("AVAILABLE"),
  location: z.string().trim().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
});
export type RegisterAssetInput = z.infer<typeof registerAssetSchema>;

export const transferAssetSchema = z.object({
  assetId: z.string().uuid(),
  userId: z.string().uuid("Pilih pengguna penerima"),
  location: z.string().trim().optional().nullable(),
});
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
