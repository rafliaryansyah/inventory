import { z } from "zod";

export const createDeliveryNoteSchema = z.object({
  requestId: z.string().uuid(),
  assetIds: z.array(z.string().uuid()).min(1, "Pilih minimal 1 aset"),
});
export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;

export const signDeliveryNoteSchema = z.object({
  dnId: z.string().uuid(),
  // base64 PNG data URL from the signature canvas
  signatureData: z.string().min(50, "Tanda tangan wajib diisi"),
});
export type SignDeliveryNoteInput = z.infer<typeof signDeliveryNoteSchema>;
