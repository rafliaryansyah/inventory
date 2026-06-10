import { getAssets, getAssignableUsers } from "@/lib/queries/assets";
import { getCategories } from "@/lib/queries/inventory";
import { PageHeader } from "@/components/ui/page-header";
import { MasterAsetClient } from "@/components/features/admin/master-aset-client";

export default async function MasterAsetPage() {
  const [assets, categories, users] = await Promise.all([
    getAssets(),
    getCategories(),
    getAssignableUsers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Aset"
        title={
          <>
            Master <span className="italic text-amber">Aset</span>
          </>
        }
        subtitle="Registrasi, pelacakan QR, dan transfer kepemilikan seluruh aset."
      />
      <MasterAsetClient
        assets={assets}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          division: u.division,
        }))}
      />
    </div>
  );
}
