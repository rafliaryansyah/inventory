"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { generateDnNumber } from "@/lib/codegen";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { toActionError } from "@/lib/action-helpers";
import {
  createDeliveryNoteSchema,
  signDeliveryNoteSchema,
} from "@/lib/validations/delivery-note";
import {
  getDeliveryNoteDetail,
  type DeliveryNoteDetail,
} from "@/lib/queries/delivery-notes";
import { buildDeliveryNotePdf } from "@/lib/dn-pdf";
import {
  isStorageConfigured,
  uploadObject,
  buildKey,
} from "@/lib/storage";
import { ok, fail, type ActionResult } from "@/types";

/** On-demand DN detail for the printable preview. */
export async function fetchDeliveryNoteDetail(
  id: string,
): Promise<ActionResult<DeliveryNoteDetail>> {
  try {
    await requireRole("ADMIN_ASET");
    const detail = await getDeliveryNoteDetail(id);
    if (!detail) return fail("Delivery Note tidak ditemukan.");
    return ok(detail);
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function createDeliveryNote(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const { requestId, assetIds } = createDeliveryNoteSchema.parse(input);

    const req = await prisma.assetRequest.findUnique({
      where: { id: requestId },
      include: { deliveryNote: { select: { id: true } } },
    });
    if (!req) return fail("Permintaan tidak ditemukan.");
    if (req.deliveryNote) return fail("Delivery Note untuk permintaan ini sudah ada.");
    if (req.status !== "APPROVED" && req.status !== "PROCESSING") {
      return fail("Delivery Note hanya bisa dibuat dari permintaan yang disetujui.");
    }

    const id = await prisma.$transaction(async (tx) => {
      const dnNumber = await generateDnNumber(tx);
      const dn = await tx.deliveryNote.create({
        data: {
          dnNumber,
          requestId: req.id,
          recipientId: req.requesterId,
          createdById: user.id,
          status: "READY_TO_SIGN",
          items: { create: assetIds.map((assetId) => ({ assetId })) },
        },
      });

      await tx.assetRequest.update({
        where: { id: req.id },
        data: {
          status: "READY_TO_SIGN",
          timeline: {
            create: {
              label: "Delivery Note diterbitkan",
              actor: user.name ?? "Admin Aset",
            },
          },
        },
      });

      await notify(tx, {
        userId: req.requesterId,
        type: "DN_READY",
        title: "Delivery Note siap",
        message: `Delivery Note ${dnNumber} untuk permintaan ${req.requestNumber} siap ditandatangani.`,
        entityId: dn.id,
      });

      await logAudit(tx, {
        userId: user.id,
        action: "CREATE",
        entityType: "DeliveryNote",
        entityId: dn.id,
        changes: { dnNumber, assets: assetIds.length },
      });

      return dn.id;
    });

    revalidatePath("/antrian");
    revalidatePath("/delivery-notes");
    revalidatePath("/permintaan");
    revalidatePath("/", "layout");
    return ok({ id }, "Delivery Note dibuat.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function signDeliveryNote(
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET", "KARYAWAN");
    const { dnId, signatureData } = signDeliveryNoteSchema.parse(input);

    const dn = await prisma.deliveryNote.findUnique({
      where: { id: dnId },
      include: { items: { select: { assetId: true } }, request: true },
    });
    if (!dn) return fail("Delivery Note tidak ditemukan.");
    if (dn.status !== "READY_TO_SIGN") {
      return fail("Delivery Note ini tidak dalam status siap tanda tangan.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.deliveryNote.update({
        where: { id: dnId },
        data: { signatureData, signedAt: new Date(), status: "SIGNED" },
      });

      // Assets handed over → IN_USE, assigned to recipient.
      for (const it of dn.items) {
        await tx.asset.update({
          where: { id: it.assetId },
          data: { status: "IN_USE", assignedToId: dn.recipientId },
        });
      }

      await tx.assetRequest.update({
        where: { id: dn.requestId },
        data: {
          status: "COMPLETED",
          timeline: {
            create: {
              label: "Aset diterima & ditandatangani",
              actor: user.name ?? "Penerima",
            },
          },
        },
      });

      await notify(tx, {
        userId: dn.recipientId,
        type: "ASSET_RECEIVED",
        title: "Aset diterima",
        message: `Serah terima ${dn.dnNumber} selesai. Aset telah tercatat atas nama Anda.`,
        entityId: dn.id,
      });

      await logAudit(tx, {
        userId: user.id,
        action: "SIGN",
        entityType: "DeliveryNote",
        entityId: dn.id,
      });
    });

    revalidatePath("/delivery-notes");
    revalidatePath("/antrian");
    revalidatePath("/master-aset");
    revalidatePath("/permintaan");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return ok(undefined, "Delivery Note ditandatangani.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function archiveDeliveryNote(dnId: string): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const dn = await prisma.deliveryNote.findUnique({ where: { id: dnId } });
    if (!dn) return fail("Delivery Note tidak ditemukan.");
    if (dn.status !== "SIGNED") {
      return fail("Hanya Delivery Note yang sudah ditandatangani yang bisa diarsipkan.");
    }
    await prisma.deliveryNote.update({
      where: { id: dnId },
      data: { status: "ARCHIVED" },
    });
    await logAudit(prisma, {
      userId: user.id,
      action: "ARCHIVE",
      entityType: "DeliveryNote",
      entityId: dnId,
    });
    revalidatePath("/delivery-notes");
    return ok(undefined, "Delivery Note diarsipkan.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

/** Generate the DN PDF and upload to Cloudflare R2, storing the URL. */
export async function generateDnPdf(
  dnId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireRole("ADMIN_ASET");
    if (!isStorageConfigured()) {
      return fail(
        "Penyimpanan file (Cloudflare R2) belum dikonfigurasi. PDF tidak dapat disimpan.",
      );
    }

    const dn = await prisma.deliveryNote.findUnique({
      where: { id: dnId },
      include: {
        recipient: { select: { name: true, division: true } },
        creator: { select: { name: true } },
        request: { select: { requestNumber: true } },
        items: {
          include: {
            asset: { include: { category: { select: { name: true } } } },
          },
        },
      },
    });
    if (!dn) return fail("Delivery Note tidak ditemukan.");

    const bytes = await buildDeliveryNotePdf({
      dnNumber: dn.dnNumber,
      createdAt: dn.createdAt,
      recipientName: dn.recipient.name,
      recipientDivision: dn.recipient.division,
      creatorName: dn.creator.name,
      requestNumber: dn.request.requestNumber,
      signedAt: dn.signedAt,
      items: dn.items.map((it) => ({
        assetCode: it.asset.assetCode,
        name: it.asset.name,
        category: it.asset.category.name,
      })),
    });

    const key = buildKey("delivery-notes", `${dn.dnNumber}.pdf`);
    const { url } = await uploadObject(key, Buffer.from(bytes), "application/pdf");

    await prisma.deliveryNote.update({
      where: { id: dnId },
      data: { pdfUrl: url },
    });
    await logAudit(prisma, {
      userId: user.id,
      action: "EXPORT_PDF",
      entityType: "DeliveryNote",
      entityId: dnId,
    });

    revalidatePath("/delivery-notes");
    return ok({ url }, "PDF berhasil dibuat & diunggah.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
