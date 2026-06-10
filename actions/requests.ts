"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-guards";
import { generateRequestNumber } from "@/lib/codegen";
import { getRequestDetail, type RequestDetail } from "@/lib/queries/requests";
import { logAudit } from "@/lib/audit";
import { notify, notifyMany } from "@/lib/notify";
import { toActionError } from "@/lib/action-helpers";
import {
  submitRequestSchema,
  rejectRequestSchema,
} from "@/lib/validations/request";
import { ok, fail, type ActionResult } from "@/types";

/** On-demand detail fetch for the Request Detail modal. */
export async function fetchRequestDetail(
  id: string,
): Promise<ActionResult<RequestDetail>> {
  try {
    await requireUser();
    const detail = await getRequestDetail(id);
    if (!detail) return fail("Permintaan tidak ditemukan.");
    return ok(detail);
  } catch (e) {
    return fail(toActionError(e));
  }
}

function revalidateRequestViews() {
  revalidatePath("/permintaan");
  revalidatePath("/dashboard");
  revalidatePath("/approval");
  revalidatePath("/riwayat");
  revalidatePath("/antrian");
  revalidatePath("/", "layout");
}

export async function submitRequest(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("KARYAWAN");
    const data = submitRequestSchema.parse(input);

    const id = await prisma.$transaction(async (tx) => {
      const requestNumber = await generateRequestNumber(tx);
      const request = await tx.assetRequest.create({
        data: {
          requestNumber,
          requesterId: user.id,
          reason: data.reason,
          urgency: data.urgency,
          status: "PENDING_APPROVAL",
          neededDate: data.neededDate,
          items: {
            create: data.items.map((it) => ({
              categoryId: it.categoryId ?? null,
              itemName: it.itemName,
              quantity: it.quantity,
              notes: it.notes ?? null,
            })),
          },
          timeline: {
            create: {
              label: "Permintaan dikirim",
              actor: user.name ?? "Karyawan",
            },
          },
        },
      });

      // Route notification to managers (same division first, else all).
      const inDivision = user.division
        ? await tx.user.findMany({
            where: { role: "MANAGER", isActive: true, division: user.division },
            select: { id: true },
          })
        : [];
      const managers =
        inDivision.length > 0
          ? inDivision
          : await tx.user.findMany({
              where: { role: "MANAGER", isActive: true },
              select: { id: true },
            });

      await notifyMany(
        tx,
        managers.map((m) => m.id),
        {
          type: "NEW_REQUEST",
          title: "Permintaan baru menunggu approval",
          message: `${user.name ?? "Karyawan"} mengajukan permintaan ${requestNumber}.`,
          entityId: request.id,
        },
      );

      await logAudit(tx, {
        userId: user.id,
        action: "CREATE",
        entityType: "AssetRequest",
        entityId: request.id,
        changes: { requestNumber, items: data.items.length },
      });

      return request.id;
    });

    revalidateRequestViews();
    return ok({ id });
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function approveRequest(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole("MANAGER");

    await prisma.$transaction(async (tx) => {
      const req = await tx.assetRequest.findUnique({ where: { id } });
      if (!req) throw new Error("NOT_FOUND");
      if (req.status !== "PENDING_APPROVAL") {
        throw new Error("Permintaan ini sudah diputuskan.");
      }

      await tx.assetRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
          timeline: {
            create: {
              label: `Disetujui oleh ${user.name ?? "Manager"}`,
              actor: user.name ?? "Manager",
            },
          },
        },
      });

      await notify(tx, {
        userId: req.requesterId,
        type: "APPROVED",
        title: "Permintaan disetujui",
        message: `Permintaan ${req.requestNumber} Anda telah disetujui.`,
        entityId: req.id,
      });

      await logAudit(tx, {
        userId: user.id,
        action: "APPROVE",
        entityType: "AssetRequest",
        entityId: req.id,
      });
    });

    revalidateRequestViews();
    return ok(undefined, "Permintaan disetujui.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function rejectRequest(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireRole("MANAGER");
    const { reason } = rejectRequestSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      const req = await tx.assetRequest.findUnique({ where: { id } });
      if (!req) throw new Error("NOT_FOUND");
      if (req.status !== "PENDING_APPROVAL") {
        throw new Error("Permintaan ini sudah diputuskan.");
      }

      await tx.assetRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedById: user.id,
          approvedAt: new Date(),
          rejectReason: reason,
          timeline: {
            create: {
              label: `Ditolak oleh ${user.name ?? "Manager"}`,
              actor: user.name ?? "Manager",
            },
          },
        },
      });

      await notify(tx, {
        userId: req.requesterId,
        type: "REJECTED",
        title: "Permintaan ditolak",
        message: `Permintaan ${req.requestNumber} Anda ditolak. Lihat alasannya di detail.`,
        entityId: req.id,
      });

      await logAudit(tx, {
        userId: user.id,
        action: "REJECT",
        entityType: "AssetRequest",
        entityId: req.id,
        changes: { reason },
      });
    });

    revalidateRequestViews();
    return ok(undefined, "Permintaan ditolak.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function startProcessing(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");

    const req = await prisma.assetRequest.findUnique({ where: { id } });
    if (!req) return fail("Permintaan tidak ditemukan.");
    if (req.status !== "APPROVED") {
      return fail("Hanya permintaan yang sudah disetujui yang bisa diproses.");
    }

    await prisma.assetRequest.update({
      where: { id },
      data: {
        status: "PROCESSING",
        timeline: {
          create: {
            label: `Diproses oleh ${user.name ?? "Admin Aset"}`,
            actor: user.name ?? "Admin Aset",
          },
        },
      },
    });

    revalidatePath("/antrian");
    revalidatePath("/permintaan");
    return ok(undefined, "Permintaan mulai diproses.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
