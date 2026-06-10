"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RequestDetailModal } from "@/components/modals/request-detail-modal";
import { formatDate } from "@/lib/format";
import { FileText } from "lucide-react";

type Item = {
  id: string;
  requestNumber: string;
  createdAt: Date | string;
  status: string;
  urgency: string;
  items: { itemName: string; quantity: number }[];
};

function itemSummary(items: { itemName: string }[]): string {
  if (items.length === 0) return "—";
  const first = items[0].itemName;
  return items.length > 1 ? `${first} +${items.length - 1} lainnya` : first;
}

export function RecentActivity({ requests }: { requests: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="Belum ada permintaan"
        description="Permintaan aset yang Anda ajukan akan muncul di sini."
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {requests.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => setSelected(r.id)}
              className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-warm/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-mute">
                    {r.requestNumber}
                  </span>
                  <Badge status={r.urgency} />
                </div>
                <p className="mt-0.5 truncate text-sm text-ink">
                  {itemSummary(r.items)}
                </p>
                <p className="text-xs text-ink-mute">{formatDate(r.createdAt)}</p>
              </div>
              <Badge status={r.status} />
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-mute" />
            </button>
          </li>
        ))}
      </ul>
      <RequestDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        requestId={selected}
        mode="view"
      />
    </>
  );
}
