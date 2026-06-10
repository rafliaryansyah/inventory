"use server";

import { revalidatePath } from "next/cache";
import type { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { generateAssetCode } from "@/lib/codegen";
import { logAudit } from "@/lib/audit";
import { toActionError } from "@/lib/action-helpers";
import {
  registerAssetSchema,
  transferAssetSchema,
} from "@/lib/validations/asset";
import { ok, fail, type ActionResult } from "@/types";

export async function registerAsset(
  input: unknown,
): Promise<ActionResult<{ id: string; assetCode: string }>> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const data = registerAssetSchema.parse(input);

    // Business rule: IN_USE requires an assignee (mirrors chk_assigned_status).
    if (data.status === "IN_USE" && !data.assignedToId) {
      return fail("Aset berstatus 'Digunakan' wajib memiliki pengguna.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const assetCode = await generateAssetCode(tx);
      return tx.asset.create({
        data: {
          assetCode,
          qrCode: assetCode,
          name: data.name,
          categoryId: data.categoryId,
          status: data.status,
          location: data.location ?? null,
          assignedToId: data.assignedToId ?? null,
          purchaseDate: data.purchaseDate ?? null,
        },
      });
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "CREATE",
      entityType: "Asset",
      entityId: result.id,
      changes: { assetCode: result.assetCode },
    });

    revalidatePath("/master-aset");
    return ok(
      { id: result.id, assetCode: result.assetCode },
      `Aset ${result.assetCode} didaftarkan.`,
    );
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function transferAsset(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const data = transferAssetSchema.parse(input);

    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) return fail("Aset tidak ditemukan.");

    await prisma.asset.update({
      where: { id: data.assetId },
      data: {
        assignedToId: data.userId,
        status: "IN_USE",
        location: data.location ?? asset.location,
      },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "TRANSFER",
      entityType: "Asset",
      entityId: data.assetId,
      changes: { from: asset.assignedToId, to: data.userId },
    });

    revalidatePath("/master-aset");
    return ok(undefined, "Kepemilikan aset dipindahkan.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

const SETTABLE: AssetStatus[] = ["AVAILABLE", "MAINTENANCE", "DAMAGED", "RETIRED"];

export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    if (!SETTABLE.includes(status)) {
      return fail("Status aset tidak valid.");
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status,
        // Releasing an asset clears its assignee.
        ...(status === "AVAILABLE" || status === "RETIRED"
          ? { assignedToId: null }
          : {}),
      },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "UPDATE_STATUS",
      entityType: "Asset",
      entityId: assetId,
      changes: { status },
    });

    revalidatePath("/master-aset");
    return ok(undefined, "Status aset diperbarui.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function setAssetMaintenance(assetId: string): Promise<ActionResult> {
  return updateAssetStatus(assetId, "MAINTENANCE");
}
