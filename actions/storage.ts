"use server";

import { requireUser } from "@/lib/auth-guards";
import { isStorageConfigured, uploadObject, buildKey } from "@/lib/storage";
import { toActionError } from "@/lib/action-helpers";
import { ok, fail, type ActionResult } from "@/types";

/** Generic resource upload to Cloudflare R2. */
export async function uploadResource(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireUser();
    if (!isStorageConfigured()) {
      return fail("Penyimpanan file (Cloudflare R2) belum dikonfigurasi.");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) return fail("File tidak ditemukan.");
    if (file.size > 10 * 1024 * 1024) return fail("Ukuran file maksimal 10 MB.");

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = buildKey("resources", file.name || "file");
    const { url } = await uploadObject(
      key,
      bytes,
      file.type || "application/octet-stream",
    );

    return ok({ url }, "File berhasil diunggah.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
