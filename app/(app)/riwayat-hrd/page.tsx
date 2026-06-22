import { getHrdApprovalHistory } from "@/lib/queries/requests";
import { PageHeader } from "@/components/ui/page-header";
import { RiwayatClient } from "@/components/features/manager/riwayat-client";

export default async function RiwayatHrdPage() {
  const history = await getHrdApprovalHistory("ALL");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="HRD"
        title={
          <>
            Riwayat <span className="italic text-amber">Approval HRD</span>
          </>
        }
        subtitle="Catatan seluruh keputusan persetujuan & penolakan oleh HRD."
      />
      <RiwayatClient history={history} />
    </div>
  );
}
