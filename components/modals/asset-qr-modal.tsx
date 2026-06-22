"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AssetQr } from "@/components/ui/asset-qr";

type QrAsset = { id: string; assetCode: string; name: string };

export function AssetQrModal({
  asset,
  baseUrl,
  onClose,
}: {
  asset: QrAsset | null;
  baseUrl: string;
  onClose: () => void;
}) {
  const url = asset ? `${baseUrl}/p/${asset.id}` : "";

  return (
    <Modal
      open={asset !== null}
      onClose={onClose}
      eyebrow={asset?.assetCode}
      title="QR Aset"
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      {asset && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-ink-soft">
            Scan untuk membuka halaman detail publik{" "}
            <span className="font-medium text-ink">{asset.name}</span>.
          </p>
          <div className="rounded-xl border border-line bg-paper p-4">
            <AssetQr value={url} size={220} />
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full break-all rounded-md bg-warm px-3 py-2 font-mono text-xs text-ink-soft"
          >
            {url}
          </a>
          <Button
            variant="primary"
            className="w-full"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            Buka Halaman Publik
          </Button>
        </div>
      )}
    </Modal>
  );
}
