"use server";

import { revalidatePath } from "next/cache";
import type { PoStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { generatePoNumber } from "@/lib/codegen";
import { logAudit } from "@/lib/audit";
import { toActionError } from "@/lib/action-helpers";
import { createPurchaseOrderSchema } from "@/lib/validations/purchase-order";
import { ok, fail, type ActionResult } from "@/types";

export async function createPurchaseOrder(
  input: unknown,
): Promise<ActionResult<{ id: string; poNumber: string }>> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const data = createPurchaseOrderSchema.parse(input);

    const totalCost = data.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice,
      0,
    );

    const result = await prisma.$transaction(async (tx) => {
      const poNumber = await generatePoNumber(tx);
      return tx.purchaseOrder.create({
        data: {
          poNumber,
          supplier: data.supplier,
          status: "DRAFT",
          itemCount: data.items.length,
          totalCost,
          notes: data.notes ?? null,
          expectedAt: data.expectedAt ?? null,
        },
      });
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: result.id,
      changes: { poNumber: result.poNumber, totalCost },
    });

    revalidatePath("/pengadaan");
    return ok(
      { id: result.id, poNumber: result.poNumber },
      `Purchase Order ${result.poNumber} dibuat.`,
    );
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function updatePurchaseOrderStatus(
  poId: string,
  status: PoStatus,
): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    if (status === "RECEIVED") return markPOReceived(poId);
    if (!["DRAFT", "APPROVED", "IN_PROGRESS"].includes(status)) {
      return fail("Status PO tidak valid.");
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "UPDATE_STATUS",
      entityType: "PurchaseOrder",
      entityId: poId,
      changes: { status },
    });

    revalidatePath("/pengadaan");
    return ok(undefined, "Status PO diperbarui.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function markPOReceived(poId: string): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
    await logAudit(prisma, {
      userId: user.id,
      action: "RECEIVE",
      entityType: "PurchaseOrder",
      entityId: poId,
    });
    revalidatePath("/pengadaan");
    return ok(undefined, "PO ditandai sebagai diterima.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
