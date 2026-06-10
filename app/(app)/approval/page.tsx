import { getApprovalQueue } from "@/lib/queries/requests";
import { PageHeader } from "@/components/ui/page-header";
import { ApprovalClient } from "@/components/features/manager/approval-client";

export default async function ApprovalPage() {
  const requests = await getApprovalQueue();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manager"
        title={
          <>
            Antrian <span className="italic text-amber">Approval</span>
          </>
        }
        subtitle="Tinjau dan putuskan permintaan aset yang menunggu persetujuan Anda."
      />
      <ApprovalClient requests={requests} />
    </div>
  );
}
