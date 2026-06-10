"use client";

import { useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { QrGlyph } from "@/components/ui/qr-glyph";

export type ScanAsset = {
  id: string;
  assetCode: string;
  name: string;
  status: string;
  location: string | null;
  category: { name: string };
  assignedTo: { name: string } | null;
};

export function QrScannerModal({
  open,
  onClose,
  assets,
}: {
  open: boolean;
  onClose: () => void;
  assets: ScanAsset[];
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanAsset | "notfound" | null>(null);

  const lookup = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v) return;
    const found = assets.find((a) => a.assetCode.toLowerCase() === v);
    setResult(found ?? "notfound");
  };

  const simulate = () => {
    if (assets.length === 0) return;
    const a = assets[Math.floor(Math.random() * assets.length)];
    setCode(a.assetCode);
    setResult(a);
  };

  const reset = () => {
    setCode("");
    setResult(null);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      eyebrow="Master Aset"
      title="Scan QR Aset"
      size="md"
      footer={
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Tutup
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-line-dk bg-warm text-ink-mute">
          <ScanLine className="h-12 w-12" />
        </div>
        <Button
          variant="navy"
          icon={<ScanLine className="h-4 w-4" />}
          onClick={simulate}
        >
          Simulasi Scan
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-mute">
        <span className="h-px flex-1 bg-line" /> atau masukkan kode manual{" "}
        <span className="h-px flex-1 bg-line" />
      </div>

      <Field label="Kode Aset">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup(code)}
            placeholder="AST-2025-00001"
            className="font-mono"
          />
          <Button
            variant="secondary"
            icon={<Search className="h-4 w-4" />}
            onClick={() => lookup(code)}
          >
            Cari
          </Button>
        </div>
      </Field>

      {result === "notfound" && (
        <p className="mt-4 rounded-md bg-rust-sf px-4 py-3 text-sm text-rust">
          Aset dengan kode tersebut tidak ditemukan.
        </p>
      )}

      {result && result !== "notfound" && (
        <div className="anim-scale mt-4 flex gap-4 rounded-lg border border-line bg-warm/50 p-4">
          <QrGlyph value={result.assetCode} size={64} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium text-ink">
              {result.assetCode}
            </p>
            <p className="text-sm text-ink">{result.name}</p>
            <p className="text-xs text-ink-mute">{result.category.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge status={result.status} />
              {result.assignedTo && (
                <span className="text-xs text-ink-soft">
                  Pengguna: {result.assignedTo.name}
                </span>
              )}
            </div>
            {result.location && (
              <p className="mt-1 text-xs text-ink-mute">📍 {result.location}</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
