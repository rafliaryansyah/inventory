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
        subtitle="Daftar aset yang berstatus tersedia dan siap untuk diajukan."
        actions={
          <Link href="/permintaan/baru" className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" />
            Ajukan Permintaan
          </Link>
        }
      />
      <AsetTersediaClient assets={assets} />
    </div>
  );
}
