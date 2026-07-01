/** Resolusi base URL absolut aplikasi (tanpa trailing slash) untuk link publik / QR
 *  DAN untuk memberi NextAuth nilai AUTH_URL yang valid.
 *
 *  Urutan prioritas:
 *    1. AUTH_URL      → dukung custom domain (di-prefix https:// bila tanpa scheme)
 *    2. RAILWAY_PUBLIC_DOMAIN → auto-config di Railway (selalu domain benar)
 *    3. http://localhost:3000 → fallback dev
 *
 *  Nilai yang tetap invalid setelah normalisasi dibuang (return null) supaya
 *  `trustHost: true` merekonstruksi dari header — jadi salah-set env tidak
 *  membuat app crash (lihat auth.config.ts).
 *
 *  Edge-safe: hanya baca process.env + new URL, tanpa import Node-only. */

/** Normalisasi kandidat URL: prefix https:// bila tanpa scheme, validasi via
 *  new URL(), lalu strip trailing slash. Return null bila tetap tidak valid. */
function normalizeUrl(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/** Base URL absolut valid, atau null jika tak ada sumber yang valid. */
export function resolveBaseUrl(): string | null {
  return (
    normalizeUrl(process.env.AUTH_URL) ??
    normalizeUrl(process.env.RAILWAY_PUBLIC_DOMAIN)
  );
}

/** Base URL untuk membangun link publik / QR. Selalu mengembalikan string
 *  (fallback localhost) agar pemanggil tak perlu handle null. */
export function getBaseUrl(): string {
  return resolveBaseUrl() ?? "http://localhost:3000";
}
