"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Tags, Minus, Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/layout/toast";
import {
  adjustStock,
  createInventory,
  createCategory,
} from "@/actions/inventory";
import { rp, rpShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InventoryRow } from "@/lib/queries/inventory";

type Category = { id: string; name: string };

export function InventoriClient({
  items,
  metrics,
  categories,
}: {
  items: InventoryRow[];
  metrics: { totalSku: number; lowOrEmpty: number; totalValue: number };
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (categoryId && it.categoryId !== categoryId) return false;
      if (q && !it.itemName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, categoryId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <MetricCard label="Total SKU" value={metrics.totalSku} accent="navy" />
        <MetricCard
          label="Stok Rendah"
          value={metrics.lowOrEmpty}
          accent="amber"
          hint="Item LOW atau habis"
        />
        <MetricCard
          label="Nilai Inventori"
          value={rpShort(metrics.totalValue)}
          accent="sage"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari item…"
            className="!pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="sm:w-48"
          aria-label="Filter kategori"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          icon={<Tags className="h-4 w-4" />}
          onClick={() => setCatOpen(true)}
        >
          Kelola Kategori
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
          Tambah Item
        </Button>
      </div>

      <Card padless>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title="Tidak ada item"
            description="Sesuaikan filter atau tambahkan item inventori baru."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">Kategori</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Item</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Stok</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Min</th>
                  <th className="eyebrow px-5 py-3 text-right text-ink-mute">
                    Harga
                  </th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr
                    key={it.id}
                    className={cn(
                      "border-b border-line/60 last:border-0",
                      it.status === "EMPTY" && "bg-rust-sf/40",
                      it.status === "LOW" && "bg-amber-sf/30",
                    )}
                  >
                    <td className="px-5 py-3 text-ink-soft">{it.categoryName}</td>
                    <td className="px-5 py-3 text-ink">{it.itemName}</td>
                    <td className="px-5 py-3">
                      <StockStepper id={it.id} stock={it.currentStock} unit={it.unit} />
                    </td>
                    <td className="px-5 py-3 font-mono text-ink-mute">
                      {it.minStock}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs">
                      {rp(it.price)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={it.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddInventoryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
      />
      <CategoryModal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        categories={categories}
      />
    </div>
  );
}

function StockStepper({
  id,
  stock,
  unit,
}: {
  id: string;
  stock: number;
  unit: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const adjust = (delta: number) =>
    start(async () => {
      const res = await adjustStock({ inventoryId: id, delta });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });

  return (
    <span className="flex items-center gap-1.5">
      <button
        onClick={() => adjust(-1)}
        disabled={pending || stock === 0}
        className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-soft transition-colors hover:border-rust hover:text-rust disabled:opacity-30"
        aria-label="Kurangi stok"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[3.5rem] text-center font-mono">
        {stock} <span className="text-xs text-ink-mute">{unit}</span>
      </span>
      <button
        onClick={() => adjust(1)}
        disabled={pending}
        className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-soft transition-colors hover:border-sage hover:text-sage disabled:opacity-30"
        aria-label="Tambah stok"
      >
        <Plus className="h-3 w-3" />
      </button>
    </span>
  );
}

function AddInventoryModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    categoryId: "",
    itemName: "",
    currentStock: "0",
    minStock: "0",
    unit: "pcs",
    price: "0",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () =>
    start(async () => {
      const res = await createInventory({
        categoryId: form.categoryId,
        itemName: form.itemName,
        currentStock: form.currentStock,
        minStock: form.minStock,
        unit: form.unit,
        price: form.price,
      });
      if (res.ok) {
        toast.success(res.message ?? "Item ditambahkan.");
        router.refresh();
        onClose();
        setForm({
          categoryId: "",
          itemName: "",
          currentStock: "0",
          minStock: "0",
          unit: "pcs",
          price: "0",
        });
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Inventori"
      title="Tambah Item Stok"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            loading={pending}
            disabled={!form.categoryId || !form.itemName.trim()}
            onClick={submit}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Kategori" required>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="">Pilih kategori…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nama Item" required>
          <input
            value={form.itemName}
            onChange={(e) => set("itemName", e.target.value)}
            placeholder="Contoh: Mouse Logitech M331"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Stok Awal">
            <input
              type="number"
              min={0}
              value={form.currentStock}
              onChange={(e) => set("currentStock", e.target.value)}
            />
          </Field>
          <Field label="Min Stok">
            <input
              type="number"
              min={0}
              value={form.minStock}
              onChange={(e) => set("minStock", e.target.value)}
            />
          </Field>
          <Field label="Satuan">
            <input
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Harga Satuan (Rp)">
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

function CategoryModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = () =>
    start(async () => {
      const res = await createCategory({ name, description });
      if (res.ok) {
        toast.success(res.message ?? "Kategori ditambahkan.");
        router.refresh();
        setName("");
        setDescription("");
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Inventori"
      title="Kelola Kategori"
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-sm bg-warm px-2.5 py-1 text-xs text-ink-soft"
            >
              {c.name}
            </span>
          ))}
        </div>
        <div className="space-y-3 border-t border-line pt-4">
          <Field label="Kategori Baru" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kategori"
            />
          </Field>
          <Field label="Deskripsi">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional"
            />
          </Field>
          <Button
            loading={pending}
            disabled={!name.trim()}
            onClick={submit}
            icon={<Plus className="h-4 w-4" />}
          >
            Tambah Kategori
          </Button>
        </div>
      </div>
    </Modal>
  );
}
