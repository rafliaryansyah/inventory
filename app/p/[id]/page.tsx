import Image from "next/image";
import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";
import { getAssetPublic } from "@/lib/queries/assets";

export const dynamic = "force-dynamic";

export default async function PublicAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await getAssetPublic(id);
  if (!asset) notFound();

  const year = asset.purchaseDate
    ? new Date(asset.purchaseDate).getFullYear().toString()
    : "—";

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Nama Aset", value: asset.name },
    { label: "Kode Aset", value: asset.assetCode, mono: true },
    { label: "Kategori", value: asset.category.name },
    { label: "Tahun Pembelian", value: year, mono: true },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Handal Informasi Teknologi"
            width={140}
            height={112}
            priority
            className="h-auto w-28"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-soft">
          <div className="flex items-center gap-3 border-b border-line bg-amber-sf/40 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber text-paper">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow text-amber-dk">Detail Aset</p>
              <p className="display-serif text-lg leading-tight text-ink">
                {asset.name}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-line">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <dt className="text-sm text-ink-mute">{r.label}</dt>
                <dd
                  className={`text-right text-sm text-ink ${
                    r.mono ? "font-mono" : "font-medium"
                  }`}
                >
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-5 text-center text-xs text-ink-mute">
          PT Handal Informasi Teknologi — Sistem Informasi Manajemen Aset
        </p>
      </div>
    </main>
  );
}
