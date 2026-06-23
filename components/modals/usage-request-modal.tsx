"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/layout/toast";
import { submitUsageRequest } from "@/actions/requests";
import { cn } from "@/lib/utils";

export type CartAsset = {
  id: string;
  assetCode: string;
  name: string;
  category: { name: string };
};

const URGENCIES = [
  { value: "RENDAH", label: "Rendah" },
  { value: "NORMAL", label: "Normal" },
  { value: "TINGGI", label: "Tinggi" },
  { value: "KRITIKAL", label: "Kritikal" },
] as const;

export function UsageRequestModal({
  open,
  onClose,
  items,
  onRemove,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  items: CartAsset[];
  onRemove: (id: string) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const valid =
    items.length > 0 && reason.trim().length >= 10 && neededDate.length > 0;

  const submit = () =>
    start(async () => {
      const res = await submitUsageRequest({
        assetIds: items.map((it) => it.id),
        reason,
        neededDate,
        urgency,
      });
      if (res.ok) {
        toast.success("Permintaan penggunaan berhasil dikirim.");
        setReason("");
        setNeededDate("");
        setUrgency("NORMAL");
        onSuccess();
        router.push("/permintaan");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Request Penggunaan"
      title="Ajukan Penggunaan Aset"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            loading={pending}
            onClick={submit}
          >
            Kirim Permintaan ({items.length})
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Aset terpilih */}
        <div>
          <p className="eyebrow text-ink-mute mb-2">Aset Dipilih</p>
          {items.length === 0 ? (
            <p className="rounded-md bg-warm px-4 py-3 text-sm text-ink-mute">
              Belum ada aset dipilih.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-warm/40 px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{it.name}</span>
                    <span className="block font-mono text-xs text-ink-mute">
                      {it.assetCode} · {it.category.name}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(it.id)}
                    className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-rust-sf hover:text-rust"
                    aria-label="Hapus dari pilihan"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Field
          label="Justifikasi"
          required
          hint={`Jelaskan kebutuhan penggunaan (min. 10 karakter) — ${reason.trim().length} ditulis`}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Contoh: Membutuhkan monitor tambahan untuk pekerjaan desain…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tanggal Dibutuhkan" required>
            <input
              type="date"
              value={neededDate}
              onChange={(e) => setNeededDate(e.target.value)}
            />
          </Field>
          <Field label="Tingkat Urgensi" required>
            <div className="grid grid-cols-4 gap-1.5">
              {URGENCIES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                    urgency === u.value
                      ? "border-amber bg-amber-sf text-amber-dk"
                      : "border-line bg-paper text-ink-soft hover:border-amber/50",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
