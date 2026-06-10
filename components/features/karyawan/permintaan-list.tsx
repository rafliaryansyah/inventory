"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RequestDetailModal } from "@/components/modals/request-detail-modal";
import { formatDate } from "@/lib/format";
import { statusLabel } from "@/lib/status";

type Req = {
  id: string;
  requestNumber: string;
  createdAt: Date | string;
  status: string;
  urgency: string;
  items: { itemName: string; quantity: number }[];
};

const STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PROCESSING",
  "READY_TO_SIGN",
  "COMPLETED",
  "REJECTED",
];
const URGENCIES = ["RENDAH", "NORMAL", "TINGGI", "KRITIKAL"];

function summary(items: { itemName: string }[]) {
  if (!items.length) return "—";
  return items.length > 1
    ? `${items[0].itemName} +${items.length - 1} lainnya`
    : items[0].itemName;
}

export function PermintaanList({ requests }: { requests: Req[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (status && r.status !== status) return false;
      if (urgency && r.urgency !== urgency) return false;
      if (q) {
        const inNumber = r.requestNumber.toLowerCase().includes(q);
        const inItems = r.items.some((it) =>
          it.itemName.toLowerCase().includes(q),
        );
        if (!inNumber && !inItems) return false;
      }
      return true;
    });
  }, [requests, search, status, urgency]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor atau nama item…"
            className="!pl-9"
            aria-label="Cari permintaan"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-48"
          aria-label="Filter status"
        >
          <option value="">Semua Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="sm:w-44"
          aria-label="Filter urgensi"
        >
          <option value="">Semua Urgensi</option>
          {URGENCIES.map((u) => (
            <option key={u} value={u}>
              {statusLabel(u)}
            </option>
          ))}
        </select>
      </div>

      <Card padless>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Tidak ada permintaan"
            description="Coba ubah filter, atau ajukan permintaan baru."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">Nomor</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Tanggal</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Item</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Urgensi</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-warm/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs">
                      {r.requestNumber}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3">{summary(r.items)}</td>
                    <td className="px-5 py-3">
                      <Badge status={r.urgency} />
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-ink-mute" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RequestDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        requestId={selected}
        mode="view"
      />
    </div>
  );
}
