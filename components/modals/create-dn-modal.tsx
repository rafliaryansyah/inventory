"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/layout/toast";
import { createDeliveryNote } from "@/actions/delivery-notes";
import { cn } from "@/lib/utils";

export type SelectableAsset = {
  id: string;
  assetCode: string;
  name: string;
  category: { name: string };
};

export function CreateDnModal({
  open,
  onClose,
  requestId,
  requestNumber,
  recipientName,
  assets,
  lockedAssets,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestNumber: string;
  recipientName: string;
  assets: SelectableAsset[];
  /** Untuk Request Penggunaan: aset sudah dipilih karyawan (read-only, semua disertakan). */
  lockedAssets?: SelectableAsset[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const locked = !!lockedAssets && lockedAssets.length > 0;
  const assetIds = locked ? lockedAssets!.map((a) => a.id) : selected;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const submit = () =>
    start(async () => {
      const res = await createDeliveryNote({ requestId, assetIds });
      if (res.ok) {
        toast.success(res.message ?? "Delivery Note dibuat.");
        router.refresh();
        setSelected([]);
        onClose();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={requestNumber}
      title="Buat Delivery Note"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            disabled={assetIds.length === 0}
            loading={pending}
            onClick={submit}
          >
            Terbitkan DN ({assetIds.length})
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-soft">
        {locked
          ? "Aset berikut dipilih oleh karyawan pada request penggunaan dan akan diserahkan kepada "
          : "Pilih aset yang akan diserahkan kepada "}
        <span className="font-medium text-ink">{recipientName}</span>.
      </p>

      {locked ? (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {lockedAssets!.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-amber bg-amber-sf/40 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs text-ink-mute">
                  {a.assetCode}
                </span>
                <span className="block text-sm text-ink">{a.name}</span>
              </span>
              <span className="text-xs text-ink-mute">{a.category.name}</span>
            </li>
          ))}
        </ul>
      ) : assets.length === 0 ? (
        <p className="rounded-md bg-amber-sf/40 px-4 py-3 text-sm text-amber-dk">
          Tidak ada aset berstatus &quot;Tersedia&quot;. Daftarkan aset baru di
          Master Aset terlebih dahulu.
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {assets.map((a) => {
            const checked = selected.includes(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    checked
                      ? "border-amber bg-amber-sf/40"
                      : "border-line hover:border-amber/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-amber bg-amber text-paper"
                        : "border-line-dk",
                    )}
                  >
                    {checked && "✓"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-ink-mute">
                      {a.assetCode}
                    </span>
                    <span className="block text-sm text-ink">{a.name}</span>
                  </span>
                  <span className="text-xs text-ink-mute">{a.category.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
