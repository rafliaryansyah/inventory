import { getHrdApprovalQueue } from "@/lib/queries/requests";
import { PageHeader } from "@/components/ui/page-header";
import { ApprovalClient } from "@/components/features/manager/approval-client";

export default async function ApprovalHrdPage() {
  const requests = await getHrdApprovalQueue();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="HRD"
        title={
          <>
            Antrian <span className="italic text-amber">Approval HRD</span>
          </>
        }
        subtitle="Permintaan yang sudah disetujui Manager dan menunggu persetujuan HRD."
      />
      <ApprovalClient requests={requests} layer="hrd" />
    </div>
  );
}
