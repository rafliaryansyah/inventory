import { getCategories } from "@/lib/queries/inventory";
import { PageHeader } from "@/components/ui/page-header";
import { RequestForm } from "@/components/features/karyawan/request-form";

export default async function PermintaanBaruPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Karyawan"
        title={
          <>
            Form <span className="italic text-amber">Permintaan</span>
          </>
        }
        subtitle="Ajukan permintaan aset baru. Permintaan akan dikirim ke manager untuk persetujuan."
      />
      <RequestForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
