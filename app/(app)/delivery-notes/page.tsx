import { getDeliveryNotes } from "@/lib/queries/delivery-notes";
import { PageHeader } from "@/components/ui/page-header";
import { DeliveryNotesClient } from "@/components/features/admin/delivery-notes-client";

export default async function DeliveryNotesPage() {
  const notes = await getDeliveryNotes();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Aset"
        title={
          <>
            Delivery <span className="italic text-amber">Notes</span>
          </>
        }
        subtitle="Dokumen serah terima aset dengan tanda tangan digital."
      />
      <DeliveryNotesClient notes={notes} />
    </div>
  );
}
