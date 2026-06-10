import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AuthError } from "@/lib/auth-guards";

/**
 * Map a thrown error to a safe, user-facing message (PLAN §11 — never leak stack).
 * AuthError and Zod validation messages are safe to surface; everything else
 * collapses to a generic message.
 */
export function toActionError(e: unknown): string {
  if (e instanceof AuthError) return e.message;
  if (e instanceof ZodError) {
    return e.errors[0]?.message ?? "Data yang dikirim tidak valid.";
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return "Data sudah ada (duplikat).";
    if (e.code === "P2025") return "Data tidak ditemukan.";
    return "Terjadi kesalahan pada database. Coba lagi.";
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}
