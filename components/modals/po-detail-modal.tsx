"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/layout/toast";
import { fetchPurchaseOrderDetail } from "@/actions/purchase-orders";
import type { PurchaseOrderDetail } from "@/lib/queries/purchase-orders";
import { formatDate, rp } from "@/lib/format";

export function PoDetailModal({
  poId,
  onClose,
}: {
  poId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!poId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setDetail(null);
    fetchPurchaseOrderDetail(poId).then((r) => {
      if (r.ok && r.data) setDetail(r.data);
      else if (!r.ok) toast.error(r.error);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId]);

  return (
    <Modal
      open={poId !== null}
      onClose={onClose}
      eyebrow={detail?.poNumber ?? "Pengadaan"}
      title="Detail Purchase Order"
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
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-warm/50 p-4">
            <div>
              <p className="eyebrow text-ink-mute">Supplier</p>
              <p className="mt-1 text-sm text-ink">{detail.supplier}</p>
            </div>
            <div>
              <p className="eyebrow text-ink-mute">Status</p>
              <div className="mt-1">
                <Badge status={detail.status} />
              </div>
            </div>
            <div>
              <p className="eyebrow text-ink-mute">Tanggal</p>
              <p className="mt-1 font-mono text-sm">
                {formatDate(detail.createdAt)}
              </p>
            </div>
            <div>
              <p className="eyebrow text-ink-mute">Estimasi Tiba</p>
              <p className="mt-1 font-mono text-sm">
                {formatDate(detail.expectedAt)}
              </p>
            </div>
          </div>

          {detail.notes && (
            <div>
              <p className="eyebrow text-ink-mute mb-1.5">Catatan</p>
              <p className="text-sm text-ink-soft">{detail.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="eyebrow text-ink-mute mb-2">Item Pengadaan</p>
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
                      <td className="px-4 py-2.5">{it.itemName}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {rp(it.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {rp(it.unitPrice * it.quantity)}
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
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-amber-dk">
                      {rp(detail.totalCost)}
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
