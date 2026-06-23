import { prisma } from "@/lib/prisma";
import type { AssetStatus } from "@prisma/client";

export type AssetFilters = { search?: string; status?: string };

/** Master Aset list (PLAN §8.2). */
export async function getAssets(filters?: AssetFilters) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status as AssetStatus;
  if (filters?.search) {
    where.OR = [
      { assetCode: { contains: filters.search, mode: "insensitive" } },
      { name: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.asset.findMany({
    where,
    orderBy: { assetCode: "desc" },
    include: {
      category: { select: { name: true } },
      assignedTo: { select: { id: true, name: true, division: true } },
      _count: { select: { photos: true } },
    },
  });
}

export type AssetRow = Awaited<ReturnType<typeof getAssets>>[number];

/** Detail aset publik (via QR) — hanya field non-sensitif, tanpa auth. */
export async function getAssetPublic(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    select: {
      id: true,
      assetCode: true,
      name: true,
      purchaseDate: true,
      category: { select: { name: true } },
    },
  });
}

/** QR scanner lookup — by asset code or qr code. */
export async function getAssetByCode(code: string) {
  return prisma.asset.findFirst({
    where: { OR: [{ assetCode: code }, { qrCode: code }] },
    include: {
      category: { select: { name: true } },
      assignedTo: { select: { id: true, name: true, division: true } },
    },
  });
}

/** Status request penggunaan yang masih "menahan" (reservasi) sebuah aset. */
const ACTIVE_USAGE_STATUSES = [
  "PENDING_APPROVAL",
  "PENDING_HRD",
  "APPROVED",
  "PROCESSING",
  "READY_TO_SIGN",
] as const;

/**
 * Aset yang benar-benar bisa dipakai/diserahkan: status AVAILABLE dan TIDAK
 * sedang ter-reservasi oleh request penggunaan yang masih aktif.
 */
export async function getAvailableAssets() {
  return prisma.asset.findMany({
    where: {
      status: "AVAILABLE",
      requestItems: {
        none: {
          request: {
            type: "PENGGUNAAN",
            status: { in: [...ACTIVE_USAGE_STATUSES] },
          },
        },
      },
    },
    orderBy: { assetCode: "asc" },
    include: { category: { select: { name: true } } },
  });
}

/** Users eligible to receive an asset transfer. */
export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, division: true, role: true },
  });
}
