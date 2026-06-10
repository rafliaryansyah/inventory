"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Inbox, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { RejectModal } from "@/components/modals/reject-modal";
import { RequestDetailModal } from "@/components/modals/request-detail-modal";
import { useToast } from "@/components/layout/toast";
import { approveRequest } from "@/actions/requests";
import { formatDate } from "@/lib/format";

type ReqCard = {
  id: string;
  requestNumber: string;
  createdAt: Date | string;
  neededDate: Date | string | null;
  urgency: string;
  reason: string;
  requester: { name: string; division: string | null; avatarColor: string | null };
  items: { id: string; itemName: string; quantity: number }[];
};

export function ApprovalClient({ requests }: { requests: ReqCard[] }) {
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const approve = (id: string) => {
    setPendingId(id);
    start(async () => {
      const res = await approveRequest(id);
      if (res.ok) {
        toast.success(res.message ?? "Permintaan disetujui.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setPendingId(null);
    });
  };

  if (requests.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Tidak ada permintaan menunggu"
          description="Semua permintaan sudah ditindaklanjuti. Mantap!"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <Card key={r.id} className="flex flex-col gap-4 md:flex-row md:items-start">
          <Avatar
            name={r.requester.name}
            color={r.requester.avatarColor}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-mute">
                {r.requestNumber}
              </span>
              <Badge status={r.urgency} />
              <span className="text-xs text-ink-mute">
                Butuh: {formatDate(r.neededDate)}
              </span>
            </div>
            <p className="display-serif mt-1 text-lg">{r.requester.name}</p>
            <p className="text-sm text-ink-mute">{r.requester.division ?? "—"}</p>
            <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{r.reason}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.items.map((it) => (
                <span
                  key={it.id}
                  className="rounded-sm bg-warm px-2 py-1 text-xs text-ink-soft"
                >
                  {it.itemName} ×{it.quantity}
                </span>
              ))}
            </div>

            <button
              onClick={() => setDetailId(r.id)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-dk hover:underline"
            >
              Lihat detail lengkap <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex shrink-0 gap-2 md:flex-col">
            <Button
              variant="sage"
              icon={<CheckCircle2 className="h-4 w-4" />}
              loading={pendingId === r.id}
              onClick={() => approve(r.id)}
            >
              Setujui
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                setRejectTarget({ id: r.id, number: r.requestNumber })
              }
            >
              Tolak
            </Button>
          </div>
        </Card>
      ))}

      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        requestId={rejectTarget?.id ?? ""}
        requestNumber={rejectTarget?.number ?? ""}
      />
      <RequestDetailModal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        requestId={detailId}
        mode="approval"
      />
    </div>
  );
}
