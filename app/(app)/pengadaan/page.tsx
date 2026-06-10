import {
  getPurchaseOrders,
  getLowStockItems,
} from "@/lib/queries/purchase-orders";
import { PageHeader } from "@/components/ui/page-header";
import { PengadaanClient } from "@/components/features/admin/pengadaan-client";

export default async function PengadaanPage() {
  const [pos, lowStockItems] = await Promise.all([
    getPurchaseOrders(),
    getLowStockItems(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Aset"
        title={
          <>
            <span className="italic text-amber">Pengadaan</span> Aset
          </>
        }
        subtitle="Kelola purchase order untuk pengadaan dan restock aset."
      />
      <PengadaanClient pos={pos} lowStockItems={lowStockItems} />
    </div>
  );
}
