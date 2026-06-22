/** Base URL absolut aplikasi (tanpa trailing slash) untuk membangun link publik / QR.
 *  Di produksi (Railway) set AUTH_URL ke domain publik. */
export function getBaseUrl(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
