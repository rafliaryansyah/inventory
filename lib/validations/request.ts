import { z } from "zod";

export const requestItemSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  itemName: z.string().trim().min(1, "Nama item wajib diisi"),
  quantity: z.coerce.number().int().positive("Qty minimal 1"),
  unitPrice: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().positive("Harga satuan harus lebih dari 0").optional(),
  ),
  buyLink: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().url("Link beli harus URL valid (mis. https://…)").optional(),
  ),
  notes: z.string().trim().optional().nullable(),
});

export const submitRequestSchema = z.object({
  reason: z.string().trim().min(10, "Justifikasi minimal 10 karakter"),
  neededDate: z.coerce.date({ message: "Tanggal dibutuhkan wajib diisi" }),
  urgency: z.enum(["RENDAH", "NORMAL", "TINGGI", "KRITIKAL"]),
  items: z.array(requestItemSchema).min(1, "Minimal 1 item diminta"),
});
export type SubmitRequestInput = z.infer<typeof submitRequestSchema>;
export type RequestItemInput = z.infer<typeof requestItemSchema>;

export const rejectRequestSchema = z.object({
  reason: z.string().trim().min(10, "Alasan penolakan minimal 10 karakter"),
});
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;
