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
  approveRequestHrd,
  rejectRequestHrd,
} from "@/actions/requests";
import type { RequestDetail } from "@/lib/queries/requests";
import { formatDate, formatDuration, rp } from "@/lib/format";
import { ExternalLink } from "lucide-react";

export function RequestDetailModal({
  open,
  onClose,
  requestId,
  mode = "view",
}: {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  mode?: "view" | "approval" | "hrd-approval";
}) {
  const isHrd = mode === "hrd-approval";
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
      const res = isHrd
        ? await approveRequestHrd(requestId)
        : await approveRequest(requestId);
      if (res.ok) {
        toast.success(res.message ?? "Permintaan disetujui.");
        router.refresh();
        onClose();
      } else toast.error(res.error);
    });

  const doReject = () =>
    start(async () => {
      if (!requestId) return;
      const res = isHrd
        ? await rejectRequestHrd(requestId, { reason })
        : await rejectRequest(requestId, { reason });
      if (res.ok) {
        toast.success(res.message ?? "Permintaan ditolak.");
        router.refresh();
        onClose();
      } else toast.error(res.error);
    });

  const canDecide = isHrd
    ? detail?.status === "PENDING_HRD"
    : mode === "approval" && detail?.status === "PENDING_APPROVAL";

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
              <Badge status={detail.type} />
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

          {/* Reject reason (if rejected) — by Manager or HRD */}
          {detail.status === "REJECTED" &&
            (detail.hrdRejectReason || detail.rejectReason) && (
              <div className="rounded-lg border-l-4 border-rust bg-rust-sf/40 px-4 py-3">
                <p className="eyebrow text-rust mb-1">
                  Alasan Penolakan{detail.hrdRejectReason ? " (HRD)" : " (Manager)"}
                </p>
                <p className="text-sm text-ink-soft">
                  {detail.hrdRejectReason ?? detail.rejectReason}
                </p>
              </div>
            )}

          {/* Items */}
          <div>
            <p className="eyebrow text-ink-mute mb-2">Item yang Diminta</p>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-warm/50 text-left">
                    <th className="eyebrow px-4 py-2 text-ink-mute">Item</th>
                    <th className="eyebrow px-4 py-2 text-right text-ink-mute">
                      Harga
                    </th>
                    <th className="eyebrow px-4 py-2 text-right text-ink-mute">
                      Qty
                    </th>
                    <th className="eyebrow px-4 py-2 text-right text-ink-mute">
                      Subtotal
                    </th>
                    <th className="eyebrow px-4 py-2 text-ink-mute">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5">
                        {it.itemName}
                        <span className="block text-xs text-ink-mute">
                          {it.asset?.assetCode
                            ? `${it.asset.assetCode} · ${it.category?.name ?? "—"}`
                            : (it.category?.name ?? "—")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {it.unitPrice == null ? "—" : rp(it.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {it.unitPrice == null
                          ? "—"
                          : rp(it.unitPrice * it.quantity)}
                      </td>
                      <td className="px-4 py-2.5">
                        {it.buyLink ? (
                          <a
                            href={it.buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-dk hover:underline"
                          >
                            Buka <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-ink-mute">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-warm/40">
                    <td className="px-4 py-2.5 font-medium" colSpan={3}>
                      Total Estimasi
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-amber-dk">
                      {rp(
                        detail.items.reduce(
                          (s, it) => s + (it.unitPrice ?? 0) * it.quantity,
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
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

          {/* Lead time per tahap (bottleneck) */}
          <LeadTime detail={detail} />

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

type StageState = "done" | "ongoing" | "pending" | "cancelled";
type Stage = { label: string; state: StageState; durationMs: number | null };

function LeadTime({ detail }: { detail: RequestDetail }) {
  const now = Date.now();
  const ms = (d: Date | string | null | undefined) =>
    d ? new Date(d).getTime() : null;

  const submitted = ms(detail.createdAt)!;
  const mgr = ms(detail.approvedAt);
  const hrd = ms(detail.hrdApprovedAt);
  const done = ms(detail.deliveryNote?.signedAt);
  const rejected = detail.status === "REJECTED";
  const mgrRejected = rejected && hrd == null;

  const stages: Stage[] = [
    // 1) Manager: diajukan → keputusan manager (approvedAt selalu terisi saat manager bertindak)
    mgr != null
      ? { label: "Persetujuan Manager", state: "done", durationMs: mgr - submitted }
      : { label: "Persetujuan Manager", state: "ongoing", durationMs: now - submitted },
    // 2) HRD: keputusan manager → keputusan HRD
    mgrRejected
      ? { label: "Persetujuan HRD", state: "cancelled", durationMs: null }
      : mgr == null
        ? { label: "Persetujuan HRD", state: "pending", durationMs: null }
        : hrd != null
          ? { label: "Persetujuan HRD", state: "done", durationMs: hrd - mgr }
          : { label: "Persetujuan HRD", state: "ongoing", durationMs: now - mgr },
    // 3) Admin Aset: keputusan HRD → serah terima (TTD)
    rejected
      ? { label: "Serah Terima (Admin Aset)", state: "cancelled", durationMs: null }
      : hrd == null
        ? { label: "Serah Terima (Admin Aset)", state: "pending", durationMs: null }
        : done != null
          ? { label: "Serah Terima (Admin Aset)", state: "done", durationMs: done - hrd }
          : { label: "Serah Terima (Admin Aset)", state: "ongoing", durationMs: now - hrd },
  ];

  // Total: diajukan → selesai / titik penolakan / sekarang
  const totalEnd = done ?? (rejected ? (hrd ?? mgr ?? now) : now);
  const totalOngoing = !done && !rejected;

  // Bottleneck = tahap dengan durasi terlama (di antara done/ongoing).
  let bottleneck = -1;
  let maxDur = -1;
  stages.forEach((s, i) => {
    if (s.durationMs != null && s.durationMs > maxDur) {
      maxDur = s.durationMs;
      bottleneck = i;
    }
  });

  return (
    <div>
      <p className="eyebrow text-ink-mute mb-2">Lead Time per Tahap</p>
      <div className="overflow-hidden rounded-lg border border-line">
        <ul className="divide-y divide-line">
          {stages.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm text-ink">
                {s.label}
                {i === bottleneck && (
                  <span className="rounded-sm bg-rust-sf px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rust">
                    Bottleneck
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right font-mono text-xs">
                {s.state === "done" && (
                  <span className="text-ink-soft">
                    {formatDuration(s.durationMs!)}
                  </span>
                )}
                {s.state === "ongoing" && (
                  <span className="text-amber-dk">
                    Berjalan · {formatDuration(s.durationMs!)}
                  </span>
                )}
                {s.state === "pending" && (
                  <span className="text-ink-mute">Menunggu</span>
                )}
                {s.state === "cancelled" && (
                  <span className="text-ink-mute">—</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-warm/40 px-4 py-2.5">
          <span className="text-sm font-medium text-ink">Total Lead Time</span>
          <span className="text-right font-mono text-xs font-medium text-ink">
            {formatDuration(totalEnd - submitted)}
            {totalOngoing && (
              <span className="font-normal text-ink-mute"> (berjalan)</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
