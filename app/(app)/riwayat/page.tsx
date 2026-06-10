import { getApprovalHistory } from "@/lib/queries/requests";
import { PageHeader } from "@/components/ui/page-header";
import { RiwayatClient } from "@/components/features/manager/riwayat-client";

export default async function RiwayatPage() {
  const history = await getApprovalHistory("ALL");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manager"
        title={
          <>
            Riwayat <span className="italic text-amber">Approval</span>
          </>
        }
        subtitle="Catatan seluruh keputusan persetujuan dan penolakan permintaan."
      />
      <RiwayatClient history={history} />
    </div>
  );
}
