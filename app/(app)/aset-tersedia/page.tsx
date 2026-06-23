import Link from "next/link";
import { Plus } from "lucide-react";
import { getAvailableAssets } from "@/lib/queries/assets";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { AsetTersediaClient } from "@/components/features/karyawan/aset-tersedia-client";

export default async function AsetTersediaPage() {
  const assets = await getAvailableAssets();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Karyawan"
        title={
          <>
            Aset <span className="italic text-amber">Tersedia</span>
          </>
        }
        subtitle="Pilih aset yang ingin dipakai lalu ajukan penggunaannya. Butuh barang yang belum ada? Ajukan pembelian."
        actions={
          <Link href="/permintaan/baru" className={buttonClasses("secondary", "md")}>
            <Plus className="h-4 w-4" />
            Request Pembelian
          </Link>
        }
      />
      <AsetTersediaClient assets={assets} />
    </div>
  );
}
