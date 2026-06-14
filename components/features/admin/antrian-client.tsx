"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, PlayCircle, FileText, PenLine } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  CreateDnModal,
  type SelectableAsset,
} from "@/components/modals/create-dn-modal";
import { SignatureModal } from "@/components/modals/signature-modal";
import { useToast } from "@/components/layout/toast";
import { startProcessing } from "@/actions/requests";
import { formatDate } from "@/lib/format";

type QReq = {
  id: string;
  requestNumber: string;
  neededDate: Date | string | null;
  urgency: string;
  requester: { name: string; division: string | null; avatarColor: string | null };
  items: { id: string; itemName: string; quantity: number }[];
  deliveryNote: { id: string; dnNumber: string; status: string } | null;
};

type Queue = {
  perluProses: QReq[];
  sedangProses: QReq[];
  menungguTtd: QReq[];
};

export function AntrianClient({
  queue,
  availableAssets,
}: {
  queue: Queue;
  availableAssets: SelectableAsset[];
}) {
  const [tab, setTab] = useState("perlu");
  const [page, setPage] = useState(0);
  const [dnTarget, setDnTarget] = useState<{
    id: string;
    number: string;
    recipient: string;
  } | null>(null);
  const [signTarget, setSignTarget] = useState<{
    dnId: string;
    dnNumber: string;
    recipient: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const proses = (id: string) => {
    setPendingId(id);
    start(async () => {
      const res = await startProcessing(id);
      if (res.ok) {
        toast.success(res.message ?? "Permintaan diproses.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setPendingId(null);
    });
  };

  const tabs = [
    { key: "perlu", label: "Perlu Diproses", count: queue.perluProses.length },
    { key: "proses", label: "Sedang Diproses", count: queue.sedangProses.length },
    { key: "ttd", label: "Menunggu TTD", count: queue.menungguTtd.length },
  ];

  const list =
    tab === "perlu"
      ? queue.perluProses
      : tab === "proses"
        ? queue.sedangProses
        : queue.menungguTtd;

  const PAGE_SIZE = 4;
  const pageCount = Math.ceil(list.length / PAGE_SIZE);
  // Tetap valid bila jumlah item berkurang (mis. setelah refresh).
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const pageItems = list.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Reset ke halaman pertama saat berpindah tab.
  useEffect(() => {
    setPage(0);
  }, [tab]);

  const emptyMsg =
    tab === "perlu"
      ? "Tidak ada permintaan yang perlu diproses."
      : tab === "proses"
        ? "Tidak ada permintaan yang sedang diproses."
        : "Tidak ada Delivery Note yang menunggu tanda tangan.";

  return (
    <div className="space-y-5">
      <Tabs items={tabs} active={tab} onChange={setTab} />

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Inbox className="h-6 w-6" />} title={emptyMsg} />
        </Card>
      ) : (
        <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {pageItems.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={r.requester.name}
                  color={r.requester.avatarColor}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-mute">
                      {r.requestNumber}
                    </span>
                    <Badge status={r.urgency} />
                  </div>
                  <p className="text-sm font-medium text-ink">
                    {r.requester.name}
                  </p>
                  <p className="text-xs text-ink-mute">
                    {r.requester.division ?? "—"} · Butuh:{" "}
                    {formatDate(r.neededDate)}
                  </p>
                </div>
              </div>

              <ul className="space-y-1 border-t border-line pt-3 text-sm">
                {r.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span className="text-ink-soft">{it.itemName}</span>
                    <span className="font-mono text-xs text-ink-mute">
                      ×{it.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 pt-1">
                {tab === "perlu" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<PlayCircle className="h-4 w-4" />}
                      loading={pendingId === r.id}
                      onClick={() => proses(r.id)}
                    >
                      Mulai Proses
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<FileText className="h-4 w-4" />}
                      onClick={() =>
                        setDnTarget({
                          id: r.id,
                          number: r.requestNumber,
                          recipient: r.requester.name,
                        })
                      }
                    >
                      Buat DN
                    </Button>
                  </>
                )}
                {tab === "proses" && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileText className="h-4 w-4" />}
                    onClick={() =>
                      setDnTarget({
                        id: r.id,
                        number: r.requestNumber,
                        recipient: r.requester.name,
                      })
                    }
                  >
                    Buat DN
                  </Button>
                )}
                {tab === "ttd" && r.deliveryNote && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<PenLine className="h-4 w-4" />}
                    onClick={() =>
                      setSignTarget({
                        dnId: r.deliveryNote!.id,
                        dnNumber: r.deliveryNote!.dnNumber,
                        recipient: r.requester.name,
                      })
                    }
                  >
                    Buka TTD Digital
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            onChange={setPage}
          />
        </div>
      )}

      <CreateDnModal
        open={dnTarget !== null}
        onClose={() => setDnTarget(null)}
        requestId={dnTarget?.id ?? ""}
        requestNumber={dnTarget?.number ?? ""}
        recipientName={dnTarget?.recipient ?? ""}
        assets={availableAssets}
      />
      <SignatureModal
        open={signTarget !== null}
        onClose={() => setSignTarget(null)}
        dnId={signTarget?.dnId ?? ""}
        dnNumber={signTarget?.dnNumber ?? ""}
        recipientName={signTarget?.recipient ?? ""}
      />
    </div>
  );
}
