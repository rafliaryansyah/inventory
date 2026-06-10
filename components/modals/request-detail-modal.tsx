"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Timeline } from "@/components/ui/timeline";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/layout/toast";
import {
  fetchRequestDetail,
  approveRequest,
  rejectRequest,
} from "@/actions/requests";
import type { RequestDetail } from "@/lib/queries/requests";
import { formatDate } from "@/lib/format";

export function RequestDetailModal({
  open,
  onClose,
  requestId,
  mode = "view",
}: {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  mode?: "view" | "approval";
}) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (open && requestId) {
      setLoading(true);
      setRejecting(false);
      setReason("");
      setDetail(null);
      fetchRequestDetail(requestId).then((r) => {
        if (r.ok && r.data) setDetail(r.data);
        setLoading(false);
      });
    }
  }, [open, requestId]);

  const doApprove = () =>
    start(async () => {
      if (!requestId) return;
      const res = await approveRequest(requestId);
      if (res.ok) {
        toast.success(res.message ?? "Permintaan disetujui.");
        router.refresh();
        onClose();
      } else toast.error(res.error);
    });

  const doReject = () =>
    start(async () => {
      if (!requestId) return;
      const res = await rejectRequest(requestId, { reason });
      if (res.ok) {
        toast.success(res.message ?? "Permintaan ditolak.");
        router.refresh();
        onClose();
      } else toast.error(res.error);
    });

  const canDecide =
    mode === "approval" && detail?.status === "PENDING_APPROVAL";

  const footer = canDecide ? (
    rejecting ? (
      <>
        <Button variant="secondary" onClick={() => setRejecting(false)}>
          Kembali
        </Button>
        <Button
          variant="rust"
          disabled={reason.trim().length < 10}
          loading={pending}
          onClick={doReject}
        >
          Konfirmasi Tolak
        </Button>
      </>
    ) : (
      <>
        <Button variant="danger" onClick={() => setRejecting(true)}>
          Tolak
        </Button>
        <Button variant="sage" loading={pending} onClick={doApprove}>
          Setujui
        </Button>
      </>
    )
  ) : (
    <Button variant="secondary" onClick={onClose}>
      Tutup
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={detail?.requestNumber ?? "Permintaan"}
      title="Detail Permintaan"
      size="lg"
      footer={footer}
    >
      {loading || !detail ? (
        <p className="py-12 text-center text-sm text-ink-mute">Memuat detail…</p>
      ) : (
        <div className="space-y-6">
          {/* Requester + status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={detail.requester.name}
                color={detail.requester.avatarColor}
                size="lg"
              />
              <div>
                <p className="display-serif text-lg">{detail.requester.name}</p>
                <p className="text-sm text-ink-mute">
                  {detail.requester.division ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge status={detail.status} />
              <Badge status={detail.urgency} />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-warm/50 p-4">
            <div>
              <p className="eyebrow text-ink-mute">Tanggal Dibutuhkan</p>
              <p className="mt-1 font-mono text-sm">
                {formatDate(detail.neededDate)}
              </p>
            </div>
            <div>
              <p className="eyebrow text-ink-mute">Diajukan</p>
              <p className="mt-1 font-mono text-sm">
                {formatDate(detail.createdAt)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="eyebrow text-ink-mute mb-1.5">Justifikasi</p>
            <p className="text-sm text-ink-soft">{detail.reason}</p>
          </div>

          {/* Reject reason (if rejected) */}
          {detail.status === "REJECTED" && detail.rejectReason && (
            <div className="rounded-lg border-l-4 border-rust bg-rust-sf/40 px-4 py-3">
              <p className="eyebrow text-rust mb-1">Alasan Penolakan</p>
              <p className="text-sm text-ink-soft">{detail.rejectReason}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="eyebrow text-ink-mute mb-2">Item yang Diminta</p>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-warm/50 text-left">
                    <th className="eyebrow px-4 py-2 text-ink-mute">Item</th>
                    <th className="eyebrow px-4 py-2 text-ink-mute">Kategori</th>
                    <th className="eyebrow px-4 py-2 text-right text-ink-mute">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5">{it.itemName}</td>
                      <td className="px-4 py-2.5 text-ink-soft">
                        {it.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {it.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reject form (approval mode) */}
          {rejecting && (
            <Field
              label="Alasan Penolakan"
              required
              hint={`Minimal 10 karakter — ${reason.trim().length} ditulis`}
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Jelaskan alasan penolakan…"
              />
            </Field>
          )}

          {/* Timeline */}
          {detail.timeline.length > 0 && (
            <div>
              <p className="eyebrow text-ink-mute mb-3">Riwayat Status</p>
              <Timeline items={detail.timeline} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
