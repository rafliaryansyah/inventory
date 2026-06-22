"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ScanLine,
  MoreVertical,
  ArrowLeftRight,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Boxes,
  ImagePlus,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { AssetQr } from "@/components/ui/asset-qr";
import {
  QrScannerModal,
  type ScanAsset,
} from "@/components/modals/qr-scanner-modal";
import { AssetPhotosModal } from "@/components/modals/asset-photos-modal";
import { AssetQrModal } from "@/components/modals/asset-qr-modal";
import { useToast } from "@/components/layout/toast";
import {
  registerAsset,
  transferAsset,
  updateAssetStatus,
} from "@/actions/assets";
import { statusLabel } from "@/lib/status";
import type { AssetStatus } from "@prisma/client";

type Asset = {
  id: string;
  assetCode: string;
  qrCode: string | null;
  name: string;
  status: string;
  location: string | null;
  category: { name: string };
  assignedTo: { id: string; name: string; division: string | null } | null;
  _count?: { photos: number };
};
type Category = { id: string; name: string };
type User = { id: string; name: string; division: string | null };

const STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE", "DAMAGED", "RETIRED"];

export function MasterAsetClient({
  baseUrl,
  assets,
  categories,
  users,
}: {
  baseUrl: string;
  assets: Asset[];
  categories: Category[];
  users: User[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Asset | null>(null);
  const [photoTarget, setPhotoTarget] = useState<Asset | null>(null);
  const [qrTarget, setQrTarget] = useState<Asset | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (status && a.status !== status) return false;
      if (q) {
        if (
          !a.assetCode.toLowerCase().includes(q) &&
          !a.name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [assets, search, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau nama aset…"
            className="!pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
          aria-label="Filter status"
        >
          <option value="">Semua Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          icon={<ScanLine className="h-4 w-4" />}
          onClick={() => setScanOpen(true)}
        >
          Scan QR
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setRegisterOpen(true)}>
          Daftarkan Aset
        </Button>
      </div>

      <Card padless>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title="Tidak ada aset"
            description="Sesuaikan filter atau daftarkan aset baru."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">QR</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Kode Aset</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Nama</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Pengguna</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Lokasi</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setQrTarget(a)}
                        title="Lihat QR & link publik"
                        className="rounded-md p-1 transition-colors hover:bg-warm"
                        aria-label={`QR aset ${a.assetCode}`}
                      >
                        <AssetQr value={`${baseUrl}/p/${a.id}`} size={36} />
                      </button>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{a.assetCode}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-ink">
                        {a.name}
                        {!!a._count?.photos && (
                          <span
                            className="inline-flex items-center gap-0.5 text-xs text-ink-mute"
                            title={`${a._count.photos} foto`}
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            {a._count.photos}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-ink-mute">
                        {a.category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {a.assignedTo?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {a.location ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowMenu
                        asset={a}
                        onTransfer={() => setTransferTarget(a)}
                        onPhotos={() => setPhotoTarget(a)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        categories={categories}
        users={users}
      />
      <TransferModal
        asset={transferTarget}
        onClose={() => setTransferTarget(null)}
        users={users}
      />
      <QrScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        assets={assets as unknown as ScanAsset[]}
        baseUrl={baseUrl}
      />
      <AssetPhotosModal
        asset={photoTarget}
        onClose={() => setPhotoTarget(null)}
      />
      <AssetQrModal
        asset={qrTarget}
        baseUrl={baseUrl}
        onClose={() => setQrTarget(null)}
      />
    </div>
  );
}

function RowMenu({
  asset,
  onTransfer,
  onPhotos,
}: {
  asset: Asset;
  onTransfer: () => void;
  onPhotos: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const setStatus = (s: AssetStatus) => {
    setOpen(false);
    start(async () => {
      const res = await updateAssetStatus(asset.id, s);
      if (res.ok) {
        toast.success(res.message ?? "Status diperbarui.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-warm hover:text-ink disabled:opacity-50"
        aria-label="Aksi aset"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="anim-scale absolute right-0 z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-lg border border-line bg-paper shadow-lift">
          <MenuItem
            icon={<ImagePlus className="h-4 w-4" />}
            onClick={() => {
              setOpen(false);
              onPhotos();
            }}
          >
            Kelola Foto
          </MenuItem>
          <MenuItem
            icon={<ArrowLeftRight className="h-4 w-4" />}
            onClick={() => {
              setOpen(false);
              onTransfer();
            }}
          >
            Transfer Kepemilikan
          </MenuItem>
          <MenuItem
            icon={<Wrench className="h-4 w-4" />}
            onClick={() => setStatus("MAINTENANCE")}
          >
            Set Maintenance
          </MenuItem>
          <MenuItem
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => setStatus("AVAILABLE")}
          >
            Set Tersedia
          </MenuItem>
          <MenuItem
            icon={<AlertOctagon className="h-4 w-4" />}
            onClick={() => setStatus("DAMAGED")}
          >
            Set Rusak
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-warm hover:text-ink"
    >
      {icon}
      {children}
    </button>
  );
}

function RegisterModal({
  open,
  onClose,
  categories,
  users,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  users: User[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    status: "AVAILABLE",
    location: "",
    assignedToId: "",
    purchaseDate: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () =>
    start(async () => {
      const res = await registerAsset({
        name: form.name,
        categoryId: form.categoryId,
        status: form.status,
        location: form.location || undefined,
        assignedToId: form.assignedToId || undefined,
        purchaseDate: form.purchaseDate || undefined,
      });
      if (res.ok) {
        toast.success(res.message ?? "Aset didaftarkan.");
        router.refresh();
        onClose();
        setForm({
          name: "",
          categoryId: "",
          status: "AVAILABLE",
          location: "",
          assignedToId: "",
          purchaseDate: "",
        });
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Master Aset"
      title="Daftarkan Aset Baru"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            loading={pending}
            disabled={!form.name.trim() || !form.categoryId}
            onClick={submit}
          >
            Daftarkan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Aset" required>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Contoh: Laptop Lenovo ThinkPad E14"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kategori" required>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">Pilih…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {form.status === "IN_USE" && (
          <Field label="Pengguna" required hint="Wajib untuk status Digunakan">
            <select
              value={form.assignedToId}
              onChange={(e) => set("assignedToId", e.target.value)}
            >
              <option value="">Pilih pengguna…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.division ? `— ${u.division}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Lokasi">
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Gudang GA"
            />
          </Field>
          <Field label="Tanggal Pembelian">
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => set("purchaseDate", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({
  asset,
  onClose,
  users,
}: {
  asset: Asset | null;
  onClose: () => void;
  users: User[];
}) {
  const [userId, setUserId] = useState("");
  const [location, setLocation] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (asset) {
      setUserId("");
      setLocation(asset.location ?? "");
    }
  }, [asset]);

  const submit = () =>
    start(async () => {
      if (!asset) return;
      const res = await transferAsset({
        assetId: asset.id,
        userId,
        location: location || undefined,
      });
      if (res.ok) {
        toast.success(res.message ?? "Aset dipindahkan.");
        router.refresh();
        onClose();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={asset !== null}
      onClose={onClose}
      eyebrow={asset?.assetCode}
      title="Transfer Kepemilikan"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button loading={pending} disabled={!userId} onClick={submit}>
            Transfer
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-soft">
        Pindahkan <span className="font-medium text-ink">{asset?.name}</span>{" "}
        kepada pengguna baru. Status aset menjadi &quot;Digunakan&quot;.
      </p>
      <div className="space-y-4">
        <Field label="Pengguna Baru" required>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Pilih pengguna…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.division ? `— ${u.division}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lokasi">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokasi penempatan"
          />
        </Field>
      </div>
    </Modal>
  );
}
