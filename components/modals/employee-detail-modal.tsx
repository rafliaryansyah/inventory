"use client";

import { useEffect, useState } from "react";
import { Boxes, Truck, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KaryawanAvatar } from "@/components/ui/karyawan-avatar";
import { useToast } from "@/components/layout/toast";
import { fetchEmployeeDetail } from "@/actions/users";
import type { EmployeeDetail } from "@/lib/queries/users";
import { formatDate } from "@/lib/format";

function summary(items: { itemName: string }[]) {
  if (!items.length) return "—";
  return items.length > 1
    ? `${items[0].itemName} +${items.length - 1} lainnya`
    : items[0].itemName;
}

export function EmployeeDetailModal({
  employeeId,
  onClose,
}: {
  employeeId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!employeeId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setDetail(null);
    fetchEmployeeDetail(employeeId).then((r) => {
      if (r.ok && r.data) setDetail(r.data);
      else if (!r.ok) toast.error(r.error);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <Modal
      open={employeeId !== null}
      onClose={onClose}
      eyebrow="Master Karyawan"
      title="Detail Karyawan"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      {loading || !detail ? (
        <p className="py-12 text-center text-sm text-ink-mute">Memuat detail…</p>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <KaryawanAvatar size="lg" active={detail.isActive} />
              <div>
                <p className="display-serif text-lg">{detail.name}</p>
                <p className="text-sm text-ink-mute">{detail.email}</p>
                <p className="text-xs text-ink-mute">{detail.division ?? "—"}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge status={detail.role} />
              <Badge status={detail.isActive ? "AKTIF" : "NONAKTIF"} />
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Aset Dipegang" value={detail.assets.length} />
            <Stat label="Serah Terima" value={detail.deliveryNotes.length} />
            <Stat label="Permintaan" value={detail.requests.length} />
          </div>

          {/* Aset dipegang saat ini */}
          <Section icon={<Boxes className="h-4 w-4" />} title="Aset Dipegang Saat Ini">
            {detail.assets.length === 0 ? (
              <Empty text="Tidak ada aset yang sedang dipegang." />
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {detail.assets.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">{a.name}</span>
                      <span className="block font-mono text-xs text-ink-mute">
                        {a.assetCode} · {a.category.name}
                      </span>
                    </span>
                    <Badge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Riwayat serah terima */}
          <Section icon={<Truck className="h-4 w-4" />} title="Riwayat Serah Terima Aset">
            {detail.deliveryNotes.length === 0 ? (
              <Empty text="Belum ada serah terima aset." />
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {detail.deliveryNotes.map((dn) => (
                  <li key={dn.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-ink">
                        {dn.dnNumber}
                      </span>
                      <span className="text-xs text-ink-mute">
                        {formatDate(dn.signedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {dn.items
                        .map((it) => it.asset?.assetCode ?? "—")
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Riwayat permintaan */}
          <Section icon={<FileText className="h-4 w-4" />} title="Riwayat Permintaan">
            {detail.requests.length === 0 ? (
              <Empty text="Belum ada permintaan." />
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {detail.requests.map((r) => (
                  <li key={r.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-ink">
                        {r.requestNumber}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Badge status={r.type} />
                        <Badge status={r.status} />
                      </span>
                    </div>
                    <p className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-soft">
                      <span>{summary(r.items)}</span>
                      <span className="text-ink-mute">{formatDate(r.createdAt)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-warm/50 px-4 py-3 text-center">
      <p className="display-serif text-2xl text-ink">{value}</p>
      <p className="eyebrow mt-1 text-ink-mute">{label}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-2 flex items-center gap-1.5 text-ink-mute">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-line bg-warm/40 px-4 py-3 text-sm text-ink-mute">
      {text}
    </p>
  );
}
