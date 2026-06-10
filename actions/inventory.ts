"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { computeStockStatus } from "@/lib/stock";
import { logAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notify";
import { toActionError } from "@/lib/action-helpers";
import {
  adjustStockSchema,
  createInventorySchema,
  createCategorySchema,
} from "@/lib/validations/inventory";
import { ok, fail, type ActionResult } from "@/types";

async function notifyLowStock(itemName: string, entityId: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN_ASET", isActive: true },
    select: { id: true },
  });
  await notifyMany(
    prisma,
    admins.map((a) => a.id),
    {
      type: "LOW_STOCK",
      title: "Stok aset menipis",
      message: `Stok "${itemName}" sudah menipis. Pertimbangkan pengadaan.`,
      entityId,
    },
  );
}

export async function adjustStock(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const { inventoryId, delta } = adjustStockSchema.parse(input);

    const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inv) return fail("Item inventori tidak ditemukan.");

    const newStock = Math.max(0, inv.currentStock + delta);
    const status = computeStockStatus(newStock, inv.minStock);

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { currentStock: newStock, status },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "ADJUST_STOCK",
      entityType: "Inventory",
      entityId: inventoryId,
      changes: { delta, from: inv.currentStock, to: newStock },
    });

    if (inv.status === "OK" && (status === "LOW" || status === "EMPTY")) {
      await notifyLowStock(inv.itemName, inventoryId);
    }

    revalidatePath("/inventori");
    revalidatePath("/pengadaan");
    revalidatePath("/", "layout");
    return ok(undefined, "Stok diperbarui.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function createInventory(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const data = createInventorySchema.parse(input);
    const status = computeStockStatus(data.currentStock, data.minStock);

    const created = await prisma.inventory.create({
      data: {
        categoryId: data.categoryId,
        itemName: data.itemName,
        currentStock: data.currentStock,
        minStock: data.minStock,
        unit: data.unit,
        price: data.price,
        status,
      },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "CREATE",
      entityType: "Inventory",
      entityId: created.id,
    });

    revalidatePath("/inventori");
    return ok(undefined, "Item inventori ditambahkan.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function createCategory(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const data = createCategorySchema.parse(input);

    const created = await prisma.assetCategory.create({
      data: { name: data.name, description: data.description ?? null },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "CREATE",
      entityType: "AssetCategory",
      entityId: created.id,
    });

    revalidatePath("/inventori");
    revalidatePath("/master-aset");
    return ok(undefined, "Kategori ditambahkan.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
