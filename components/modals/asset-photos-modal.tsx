"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, ImageOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/layout/toast";
import {
  fetchAssetPhotos,
  uploadAssetPhoto,
  deleteAssetPhoto,
  type AssetPhotoView,
} from "@/actions/asset-photos";

type PhotoAsset = { id: string; assetCode: string; name: string };

export function AssetPhotosModal({
  asset,
  onClose,
}: {
  asset: PhotoAsset | null;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<AssetPhotoView[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  const assetId = asset?.id ?? null;

  useEffect(() => {
    if (!assetId) {
      setPhotos([]);
      return;
    }
    setLoading(true);
    fetchAssetPhotos(assetId).then((r) => {
      if (r.ok && r.data) setPhotos(r.data);
      else if (!r.ok) toast.error(r.error);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetId) return;
    startUpload(async () => {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await uploadAssetPhoto(assetId, fd);
      if (res.ok && res.data) {
        setPhotos((prev) => [...prev, res.data!]);
        toast.success(res.message ?? "Foto diunggah.");
        router.refresh();
      } else if (!res.ok) {
        toast.error(res.error);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const remove = (id: string) => {
    setDeletingId(id);
    startUpload(async () => {
      const res = await deleteAssetPhoto(id);
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        toast.success(res.message ?? "Foto dihapus.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setDeletingId(null);
    });
  };

  return (
    <Modal
      open={asset !== null}
      onClose={onClose}
      eyebrow={asset?.assetCode}
      title="Kelola Foto Aset"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <p className="mb-4 text-sm text-ink-soft">
        Foto untuk{" "}
        <span className="font-medium text-ink">{asset?.name}</span>. Format
        gambar, maksimal 5 MB per foto.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />
      <Button
        icon={<ImagePlus className="h-4 w-4" />}
        loading={uploading && deletingId === null}
        onClick={() => fileRef.current?.click()}
      >
        Tambah Foto
      </Button>

      <div className="mt-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-ink-mute">Memuat foto…</p>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-ink-mute">
            <ImageOff className="h-6 w-6" />
            <p className="text-sm">Belum ada foto untuk aset ini.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-line bg-warm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption ?? "Foto aset"}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Hapus foto"
                  disabled={deletingId === p.id}
                  onClick={() => remove(p.id)}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-md bg-paper/90 text-rust shadow-soft transition-colors hover:bg-rust-sf disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
