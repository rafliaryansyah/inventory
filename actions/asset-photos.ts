"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { logAudit } from "@/lib/audit";
import { toActionError } from "@/lib/action-helpers";
import {
  isStorageConfigured,
  uploadObject,
  deleteObject,
  urlFor,
  buildKey,
} from "@/lib/storage";
import { ok, fail, type ActionResult } from "@/types";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export type AssetPhotoView = {
  id: string;
  url: string;
  caption: string | null;
  createdAt: Date;
};

/** Daftar foto sebuah aset, dengan URL R2 yang sudah diresolve. */
export async function fetchAssetPhotos(
  assetId: string,
): Promise<ActionResult<AssetPhotoView[]>> {
  try {
    await requireRole("ADMIN_ASET");
    const rows = await prisma.assetPhoto.findMany({
      where: { assetId },
      orderBy: { createdAt: "asc" },
    });
    const photos = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        url: await urlFor(r.objectKey),
        caption: r.caption,
        createdAt: r.createdAt,
      })),
    );
    return ok(photos);
  } catch (e) {
    return fail(toActionError(e));
  }
}

/** Upload satu foto aset ke Cloudflare R2 dan simpan key-nya. */
export async function uploadAssetPhoto(
  assetId: string,
  formData: FormData,
): Promise<ActionResult<AssetPhotoView>> {
  try {
    const user = await requireRole("ADMIN_ASET");
    if (!isStorageConfigured()) {
      return fail("Penyimpanan file (Cloudflare R2) belum dikonfigurasi.");
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return fail("Aset tidak ditemukan.");

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return fail("File foto tidak ditemukan.");
    }
    if (!file.type.startsWith("image/")) {
      return fail("File harus berupa gambar.");
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return fail("Ukuran foto maksimal 5 MB.");
    }
    const caption = (formData.get("caption") as string | null)?.trim() || null;

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = buildKey(`assets/${assetId}`, file.name || "foto.jpg");
    await uploadObject(key, bytes, file.type);

    const photo = await prisma.assetPhoto.create({
      data: {
        assetId,
        objectKey: key,
        caption,
        uploadedById: user.id,
      },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "UPLOAD_PHOTO",
      entityType: "Asset",
      entityId: assetId,
      changes: { photoId: photo.id },
    });

    revalidatePath("/master-aset");
    return ok(
      {
        id: photo.id,
        url: await urlFor(key),
        caption: photo.caption,
        createdAt: photo.createdAt,
      },
      "Foto berhasil diunggah.",
    );
  } catch (e) {
    return fail(toActionError(e));
  }
}

/** Hapus foto aset dari R2 dan database. */
export async function deleteAssetPhoto(
  photoId: string,
): Promise<ActionResult> {
  try {
    const user = await requireRole("ADMIN_ASET");
    const photo = await prisma.assetPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return fail("Foto tidak ditemukan.");

    if (isStorageConfigured()) {
      try {
        await deleteObject(photo.objectKey);
      } catch {
        // Objek mungkin sudah tidak ada di R2 — tetap lanjut hapus baris DB.
      }
    }

    await prisma.assetPhoto.delete({ where: { id: photoId } });

    await logAudit(prisma, {
      userId: user.id,
      action: "DELETE_PHOTO",
      entityType: "Asset",
      entityId: photo.assetId,
      changes: { photoId },
    });

    revalidatePath("/master-aset");
    return ok(undefined, "Foto dihapus.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
