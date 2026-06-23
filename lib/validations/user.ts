import { z } from "zod";

const ROLES = ["KARYAWAN", "ADMIN_ASET", "MANAGER", "HRD"] as const;
const COLORS = ["navy", "amber", "sage", "rust"] as const;

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  division: z.string().trim().optional().nullable(),
  avatarColor: z.enum(COLORS).optional().nullable(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  division: z.string().trim().optional().nullable(),
  avatarColor: z.enum(COLORS).optional().nullable(),
  isActive: z.boolean(),
  // Kosong = password tidak diubah; kalau diisi minimal 6 karakter.
  password: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(6, "Password minimal 6 karakter").optional(),
  ),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
