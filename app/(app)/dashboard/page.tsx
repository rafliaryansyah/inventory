import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { getKaryawanDashboard } from "@/lib/queries/dashboard";
import { greeting, monthName, formatDateLong } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { RecentActivity } from "@/components/features/karyawan/recent-activity";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user;
  const data = await getKaryawanDashboard(user.id);
  const now = new Date();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatDateLong(now)}
        title={
          <>
            {greeting(now)},{" "}
            <span className="italic text-amber">{user.name}</span>
          </>
        }
        subtitle="Ringkasan permintaan dan aset yang terhubung dengan akun Anda."
        actions={
          <Link href="/permintaan/baru" className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" />
            Ajukan Permintaan Baru
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <MetricCard
          label="Permintaan Aktif"
          value={data.activeCount}
          accent="amber"
          hint="Sedang dalam proses"
        />
        <MetricCard
          label="Aset Saya"
          value={data.myAssetsCount}
          suffix="unit"
          accent="navy"
          hint="Tercatat atas nama Anda"
        />
        <MetricCard
          label={`Permintaan ${monthName(now)}`}
          value={data.monthCount}
          accent="sage"
          hint="Diajukan bulan ini"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="display-serif mb-2 text-xl">Aktivitas Terbaru</h2>
          <RecentActivity requests={data.recentRequests} />
        </Card>

        <Card>
          <h2 className="display-serif mb-2 text-xl">Aset Saya</h2>
          {data.myAssets.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Belum ada aset"
              description="Aset yang diserahkan kepada Anda akan tercatat di sini."
            />
          ) : (
            <ul className="divide-y divide-line">
              {data.myAssets.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-ink-mute">
                      {a.assetCode}
                    </p>
                    <p className="truncate text-sm text-ink">{a.name}</p>
                    <p className="text-xs text-ink-mute">{a.category.name}</p>
                  </div>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
