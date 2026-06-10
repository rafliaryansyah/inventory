"use client";

import { Fragment, useState } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  requestNumber: string;
  approvedAt: Date | string | null;
  decision: "APPROVED" | "REJECTED";
  rejectReason: string | null;
  requester: { name: string; division: string | null };
  items: { itemName: string; quantity: number }[];
};

const CHIPS = [
  { key: "ALL", label: "Semua" },
  { key: "APPROVED", label: "Disetujui" },
  { key: "REJECTED", label: "Ditolak" },
] as const;

function summary(items: { itemName: string }[]) {
  if (!items.length) return "—";
  return items.length > 1
    ? `${items[0].itemName} +${items.length - 1} lainnya`
    : items[0].itemName;
}

export function RiwayatClient({ history }: { history: Row[] }) {
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "REJECTED">("ALL");
  const rows = history.filter((r) => filter === "ALL" || r.decision === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === c.key
                ? "border-amber bg-amber-sf text-amber-dk"
                : "border-line bg-paper text-ink-soft hover:border-amber/50",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Card padless>
        {rows.length === 0 ? (
          <EmptyState
            icon={<History className="h-6 w-6" />}
            title="Belum ada keputusan"
            description="Riwayat persetujuan & penolakan akan muncul di sini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">Tanggal</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Nomor</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Pemohon</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Item</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr
                      className={cn(
                        "border-b border-line/60",
                        r.decision === "REJECTED" && !r.rejectReason && "last:border-0",
                      )}
                    >
                      <td className="px-5 py-3 text-ink-soft">
                        {formatDate(r.approvedAt)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {r.requestNumber}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-ink">{r.requester.name}</span>
                        <span className="block text-xs text-ink-mute">
                          {r.requester.division ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">{summary(r.items)}</td>
                      <td className="px-5 py-3">
                        <Badge status={r.decision} />
                      </td>
                    </tr>
                    {r.decision === "REJECTED" && r.rejectReason && (
                      <tr className="border-b border-line/60 last:border-0">
                        <td colSpan={5} className="bg-rust-sf/30 px-5 py-2.5">
                          <span className="eyebrow text-rust">Alasan: </span>
                          <span className="text-sm text-ink-soft">
                            {r.rejectReason}
                          </span>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
