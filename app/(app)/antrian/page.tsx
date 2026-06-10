import { getAdminQueue } from "@/lib/queries/requests";
import { getAvailableAssets } from "@/lib/queries/assets";
import { PageHeader } from "@/components/ui/page-header";
import { AntrianClient } from "@/components/features/admin/antrian-client";

export default async function AntrianPage() {
  const [queue, availableAssets] = await Promise.all([
    getAdminQueue(),
    getAvailableAssets(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Aset"
        title={
          <>
            Antrian <span className="italic text-amber">Proses</span>
          </>
        }
        subtitle="Proses permintaan yang telah disetujui hingga serah terima aset."
      />
      <AntrianClient queue={queue} availableAssets={availableAssets} />
    </div>
  );
}
