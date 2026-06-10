"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, FileDown, PenLine, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SignatureModal } from "@/components/modals/signature-modal";
import { useToast } from "@/components/layout/toast";
import {
  fetchDeliveryNoteDetail,
  generateDnPdf,
} from "@/actions/delivery-notes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeliveryNoteDetail } from "@/lib/queries/delivery-notes";

type DnListItem = {
  id: string;
  dnNumber: string;
  status: string;
  createdAt: Date | string;
  recipient: { name: string; division: string | null };
  request: { requestNumber: string };
  items: { id: string }[];
};

export function DeliveryNotesClient({ notes }: { notes: DnListItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null,
  );
  const [detail, setDetail] = useState<DeliveryNoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [pdfPending, startPdf] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchDeliveryNoteDetail(selectedId).then((r) => {
      if (r.ok && r.data) setDetail(r.data);
      setLoading(false);
    });
  }, [selectedId]);

  const savePdf = () => {
    if (!detail) return;
    startPdf(async () => {
      const res = await generateDnPdf(detail.id);
      if (res.ok) {
        toast.success(res.message ?? "PDF dibuat.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  if (notes.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="Belum ada Delivery Note"
          description="Delivery Note akan muncul setelah Anda membuatnya dari Antrian Proses."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
      {/* List */}
      <Card padless className="no-print h-fit overflow-hidden">
        <ul className="divide-y divide-line">
          {notes.map((dn) => {
            const active = dn.id === selectedId;
            return (
              <li key={dn.id}>
                <button
                  onClick={() => setSelectedId(dn.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors",
                    active
                      ? "border-amber bg-amber-sf/40"
                      : "border-transparent hover:bg-warm/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ink-mute">
                      {dn.dnNumber}
                    </span>
                    <Badge status={dn.status} />
                  </div>
                  <span className="text-sm text-ink">{dn.recipient.name}</span>
                  <span className="text-xs text-ink-mute">
                    {dn.recipient.division ?? "—"} · {formatDate(dn.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Preview */}
      <div className="space-y-3">
        {/* Toolbar */}
        {detail && (
          <div className="no-print flex flex-wrap justify-end gap-2">
            {detail.status === "READY_TO_SIGN" && (
              <Button
                variant="primary"
                size="sm"
                icon={<PenLine className="h-4 w-4" />}
                onClick={() => setSignOpen(true)}
              >
                TTD Digital
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Cetak
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown className="h-4 w-4" />}
              loading={pdfPending}
              onClick={savePdf}
            >
              Simpan PDF
            </Button>
          </div>
        )}

        <Card className="print-area">
          {loading || !detail ? (
            <p className="py-16 text-center text-sm text-ink-mute">
              {loading ? "Memuat dokumen…" : "Pilih Delivery Note untuk melihat dokumen."}
            </p>
          ) : (
            <DnDocument detail={detail} />
          )}
        </Card>
      </div>

      {detail && (
        <SignatureModal
          open={signOpen}
          onClose={() => setSignOpen(false)}
          dnId={detail.id}
          dnNumber={detail.dnNumber}
          recipientName={detail.recipient.name}
        />
      )}
    </div>
  );
}

function DnDocument({ detail }: { detail: DeliveryNoteDetail }) {
  return (
    <div className="space-y-6 text-ink">
      {/* Kop */}
      <div className="flex items-start justify-between border-b border-line pb-4">
        <div>
          <p className="display-serif text-xl">PT Handal Informasi Teknologi</p>
          <p className="text-sm text-ink-mute">
            Delivery Note — Serah Terima Aset
          </p>
        </div>
        <span className="display-serif text-lg text-amber">AssetFlow</span>
      </div>

      {/* Ref grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="eyebrow text-ink-mute">Nomor DN</p>
          <p className="mt-1 font-mono text-sm">{detail.dnNumber}</p>
        </div>
        <div>
          <p className="eyebrow text-ink-mute">Tanggal</p>
          <p className="mt-1 font-mono text-sm">{formatDate(detail.createdAt)}</p>
        </div>
        <div>
          <p className="eyebrow text-ink-mute">Penerima</p>
          <p className="mt-1 text-sm">
            {detail.recipient.name}
            {detail.recipient.division ? ` — ${detail.recipient.division}` : ""}
          </p>
        </div>
        <div>
          <p className="eyebrow text-ink-mute">Referensi Permintaan</p>
          <p className="mt-1 font-mono text-sm">
            {detail.request.requestNumber}
          </p>
        </div>
      </div>

      {/* Items */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left">
              <th className="eyebrow px-2 py-2 text-ink-mute">#</th>
              <th className="eyebrow px-2 py-2 text-ink-mute">Kode Aset</th>
              <th className="eyebrow px-2 py-2 text-ink-mute">Nama</th>
              <th className="eyebrow px-2 py-2 text-ink-mute">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((it, i) => (
              <tr key={it.id} className="border-b border-line/60">
                <td className="px-2 py-2 font-mono text-ink-mute">{i + 1}</td>
                <td className="px-2 py-2 font-mono text-xs">
                  {it.asset.assetCode}
                </td>
                <td className="px-2 py-2">{it.asset.name}</td>
                <td className="px-2 py-2 text-ink-soft">
                  {it.asset.category.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-right text-sm text-ink-soft">
          Total item: <span className="font-mono">{detail.items.length}</span>
        </p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-4">
        <div>
          <p className="text-sm text-ink-soft">Diserahkan oleh,</p>
          <div className="mt-12 border-b border-line-dk" />
          <p className="mt-1 text-sm font-medium">{detail.creator.name}</p>
          <p className="text-xs text-ink-mute">Admin Aset</p>
        </div>
        <div>
          <p className="text-sm text-ink-soft">Diterima oleh,</p>
          <div className="mt-2 flex h-12 items-end">
            {detail.status === "SIGNED" || detail.status === "ARCHIVED" ? (
              detail.signatureData ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={detail.signatureData}
                  alt="Tanda tangan"
                  className="max-h-12"
                />
              ) : (
                <span className="display-serif text-lg italic text-ink">
                  {detail.recipient.name}
                </span>
              )
            ) : null}
          </div>
          <div className="border-b border-line-dk" />
          <p className="mt-1 text-sm font-medium">{detail.recipient.name}</p>
          <p className="text-xs text-ink-mute">
            {detail.signedAt
              ? `Ditandatangani ${formatDate(detail.signedAt)}`
              : "Penerima"}
          </p>
        </div>
      </div>
    </div>
  );
}
