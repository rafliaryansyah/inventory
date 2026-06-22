"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ShoppingCart, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { PoDetailModal } from "@/components/modals/po-detail-modal";
import { useToast } from "@/components/layout/toast";
import {
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  markPOReceived,
} from "@/actions/purchase-orders";
import { rp, formatDate } from "@/lib/format";
import type { PoStatus } from "@prisma/client";

type Po = {
  id: string;
  poNumber: string;
  supplier: string;
  status: PoStatus;
  itemCount: number;
  totalCost: number;
  expectedAt: Date | string | null;
  createdAt: Date | string;
};

type LowStock = {
  id: string;
  itemName: string;
  categoryName: string;
  currentStock: number;
  minStock: number;
  price: number;
};

const NEXT: Record<PoStatus, { status: PoStatus; label: string } | null> = {
  DRAFT: { status: "APPROVED", label: "Setujui" },
  APPROVED: { status: "IN_PROGRESS", label: "Mulai" },
  IN_PROGRESS: { status: "RECEIVED", label: "Tandai Diterima" },
  RECEIVED: null,
};

export function PengadaanClient({
  pos,
  lowStockItems,
}: {
  pos: Po[];
  lowStockItems: LowStock[];
}) {
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const advance = (po: Po) => {
    const next = NEXT[po.status];
    if (!next) return;
    setPendingId(po.id);
    start(async () => {
      const res =
        next.status === "RECEIVED"
          ? await markPOReceived(po.id)
          : await updatePurchaseOrderStatus(po.id, next.status);
      if (res.ok) {
        toast.success(res.message ?? "Status PO diperbarui.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          PO Baru
        </Button>
      </div>

      <Card padless>
        {pos.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Belum ada Purchase Order"
            description="Buat PO baru untuk pengadaan aset."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">Nomor PO</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Supplier</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Tanggal</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">ETA</th>
                  <th className="eyebrow px-5 py-3 text-right text-ink-mute">
                    Item
                  </th>
                  <th className="eyebrow px-5 py-3 text-right text-ink-mute">
                    Total
                  </th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => {
                  const next = NEXT[po.status];
                  return (
                    <tr
                      key={po.id}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => setDetailId(po.id)}
                          className="text-amber-dk hover:underline"
                        >
                          {po.poNumber}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-ink">{po.supplier}</td>
                      <td className="px-5 py-3 text-ink-soft">
                        {formatDate(po.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {formatDate(po.expectedAt)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        {po.itemCount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs">
                        {rp(po.totalCost)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge status={po.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {next && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={pendingId === po.id}
                            onClick={() => advance(po)}
                            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                          >
                            {next.label}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PoModal
        open={open}
        onClose={() => setOpen(false)}
        lowStockItems={lowStockItems}
      />
      <PoDetailModal poId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

type ItemRow = {
  itemName: string;
  quantity: string;
  unitPrice: string;
  buyLink: string;
};

const EMPTY_PO_ITEM: ItemRow = {
  itemName: "",
  quantity: "1",
  unitPrice: "0",
  buyLink: "",
};

function PoModal({
  open,
  onClose,
  lowStockItems,
}: {
  open: boolean;
  onClose: () => void;
  lowStockItems: LowStock[];
}) {
  const [supplier, setSupplier] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_PO_ITEM }]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const total = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0,
      ),
    [items],
  );

  const setItem = (i: number, k: keyof ItemRow, v: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const addItem = (preset?: Partial<ItemRow>) =>
    setItems((prev) => [...prev, { ...EMPTY_PO_ITEM, ...preset }]);

  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const filledItems = items.filter((it) => it.itemName.trim());
  const valid = supplier.trim().length > 0 && filledItems.length > 0;

  const submit = () =>
    start(async () => {
      const res = await createPurchaseOrder({
        supplier,
        expectedAt: expectedAt || undefined,
        notes: notes || undefined,
        items: filledItems.map((it) => ({
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          buyLink: it.buyLink || undefined,
        })),
      });
      if (res.ok) {
        toast.success(res.message ?? "PO dibuat.");
        router.refresh();
        onClose();
        setSupplier("");
        setExpectedAt("");
        setNotes("");
        setItems([{ ...EMPTY_PO_ITEM }]);
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Pengadaan"
      title="Purchase Order Baru"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={pending} disabled={!valid} onClick={submit}>
            Kirim ke Manager
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplier" required>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Nama supplier"
            />
          </Field>
          <Field label="Estimasi Tiba (ETA)">
            <input
              type="date"
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
            />
          </Field>
        </div>

        {/* Low-stock callout */}
        {lowStockItems.length > 0 && (
          <div className="rounded-lg border border-amber-sf bg-amber-sf/30 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-dk">
              <AlertTriangle className="h-4 w-4" /> Stok rendah — perlu pengadaan
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lowStockItems.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() =>
                    addItem({
                      itemName: l.itemName,
                      quantity: String(Math.max(1, l.minStock - l.currentStock)),
                      unitPrice: String(l.price),
                    })
                  }
                  className="rounded-sm bg-paper px-2 py-1 text-xs text-ink-soft transition-colors hover:text-amber-dk"
                >
                  + {l.itemName} ({l.currentStock}/{l.minStock})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-ink-soft">Item Pengadaan</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => addItem()}
            >
              Tambah
            </Button>
          </div>
          {items.map((it, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-line bg-warm/30 p-2.5"
            >
              <div className="grid grid-cols-[1fr_70px_110px_auto] gap-2">
                <input
                  placeholder="Nama item"
                  value={it.itemName}
                  onChange={(e) => setItem(i, "itemName", e.target.value)}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) => setItem(i, "quantity", e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Harga"
                  value={it.unitPrice}
                  onChange={(e) => setItem(i, "unitPrice", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="flex items-center justify-center rounded-md px-2 text-ink-mute hover:bg-rust-sf hover:text-rust disabled:opacity-30"
                  aria-label="Hapus item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="url"
                placeholder="https://… (link beli, opsional)"
                value={it.buyLink}
                onChange={(e) => setItem(i, "buyLink", e.target.value)}
              />
            </div>
          ))}
        </div>

        <Field label="Catatan untuk Manager">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opsional…"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-soft">Total Estimasi</span>
          <span className="display-serif text-xl text-amber-dk">{rp(total)}</span>
        </div>
      </div>
    </Modal>
  );
}
