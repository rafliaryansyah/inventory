import {
  getInventory,
  getInventoryMetrics,
  getCategories,
} from "@/lib/queries/inventory";
import { PageHeader } from "@/components/ui/page-header";
import { InventoriClient } from "@/components/features/admin/inventori-client";

export default async function InventoriPage() {
  const [items, metrics, categories] = await Promise.all([
    getInventory(),
    getInventoryMetrics(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Aset"
        title={
          <>
            <span className="italic text-amber">Inventori</span> Gudang
          </>
        }
        subtitle="Kelola stok barang dengan status otomatis (OK / rendah / habis)."
      />
      <InventoriClient
        items={items}
        metrics={metrics}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
