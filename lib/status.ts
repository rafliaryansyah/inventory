// Status → Badge mapping (PLAN §5.6). Single source of truth for label + colors.
// Keyed by status code (shared across enums where labels coincide).

export type StatusStyle = { label: string; cls: string };

// `cls` = Tailwind background + text classes for the badge chip.
export const STATUS_STYLES: Record<string, StatusStyle> = {
  // ── RequestStatus ──
  PENDING_APPROVAL: { label: "Menunggu Manager", cls: "bg-amber-sf text-amber-dk" },
  PENDING_HRD: { label: "Menunggu HRD", cls: "bg-navy-sf text-navy" },
  APPROVED: { label: "Disetujui", cls: "bg-sage-sf text-sage" },
  REJECTED: { label: "Ditolak", cls: "bg-rust-sf text-rust" },
  PROCESSING: { label: "Diproses", cls: "bg-navy-sf text-navy" },
  READY_TO_SIGN: { label: "Siap TTD", cls: "bg-amber text-paper" },
  COMPLETED: { label: "Selesai", cls: "bg-sage text-paper" },

  // ── DeliveryNote / PurchaseOrder ──
  DRAFT: { label: "Draft", cls: "bg-line text-ink-soft" },
  SIGNED: { label: "Ditandatangani", cls: "bg-sage-sf text-sage" },
  ARCHIVED: { label: "Diarsip", cls: "bg-line text-ink-soft" },
  IN_PROGRESS: { label: "Berjalan", cls: "bg-navy-sf text-navy" },
  RECEIVED: { label: "Diterima", cls: "bg-sage-sf text-sage" },

  // ── StockStatus ──
  OK: { label: "OK", cls: "bg-sage-sf text-sage" },
  LOW: { label: "Stok Rendah", cls: "bg-amber-sf text-amber-dk" },
  EMPTY: { label: "Habis", cls: "bg-rust-sf text-rust" },

  // ── AssetStatus ──
  IN_USE: { label: "Digunakan", cls: "bg-navy-sf text-navy" },
  AVAILABLE: { label: "Tersedia", cls: "bg-sage-sf text-sage" },
  MAINTENANCE: { label: "Maintenance", cls: "bg-amber-sf text-amber-dk" },
  DAMAGED: { label: "Rusak", cls: "bg-rust-sf text-rust" },
  RETIRED: { label: "Pensiun", cls: "bg-line text-ink-soft" },

  // ── RequestType ──
  PEMBELIAN: { label: "Pembelian", cls: "bg-amber-sf text-amber-dk" },
  PENGGUNAAN: { label: "Penggunaan", cls: "bg-navy-sf text-navy" },

  // ── UserRole ──
  KARYAWAN: { label: "Karyawan", cls: "bg-navy-sf text-navy" },
  ADMIN_ASET: { label: "Admin Aset", cls: "bg-amber-sf text-amber-dk" },
  MANAGER: { label: "Manager", cls: "bg-sage-sf text-sage" },
  HRD: { label: "HRD", cls: "bg-line text-ink-soft" },

  // ── Aktivasi akun ──
  AKTIF: { label: "Aktif", cls: "bg-sage-sf text-sage" },
  NONAKTIF: { label: "Nonaktif", cls: "bg-rust-sf text-rust" },

  // ── Urgency ──
  RENDAH: { label: "Rendah", cls: "bg-line text-ink-soft" },
  NORMAL: { label: "Normal", cls: "bg-navy-sf text-navy" },
  TINGGI: { label: "Tinggi", cls: "bg-amber-sf text-amber-dk" },
  KRITIKAL: { label: "Kritikal", cls: "bg-rust text-paper" },
};

const FALLBACK: StatusStyle = { label: "—", cls: "bg-line text-ink-soft" };

export function statusStyle(code: string | null | undefined): StatusStyle {
  if (!code) return FALLBACK;
  return STATUS_STYLES[code] ?? { label: code, cls: FALLBACK.cls };
}

export function statusLabel(code: string | null | undefined): string {
  return statusStyle(code).label;
}
