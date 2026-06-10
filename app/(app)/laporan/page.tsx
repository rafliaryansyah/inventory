import { getReportData } from "@/lib/queries/reports";
import { PageHeader } from "@/components/ui/page-header";
import { LaporanClient } from "@/components/features/manager/laporan-client";

export default async function LaporanPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manager"
        title={
          <>
            Laporan & <span className="italic text-amber">Analytics</span>
          </>
        }
        subtitle="Metrik dan tren permintaan aset, dihitung dari data operasional nyata."
      />
      <LaporanClient data={data} />
    </div>
  );
}
