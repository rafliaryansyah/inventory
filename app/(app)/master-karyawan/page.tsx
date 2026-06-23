import { getEmployees } from "@/lib/queries/users";
import { PageHeader } from "@/components/ui/page-header";
import { MasterKaryawanClient } from "@/components/features/shared/master-karyawan-client";

export default async function MasterKaryawanPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title={
          <>
            Master <span className="italic text-amber">Karyawan</span>
          </>
        }
        subtitle="Kelola data karyawan dan lihat riwayat aset & permintaannya."
      />
      <MasterKaryawanClient employees={employees} />
    </div>
  );
}
