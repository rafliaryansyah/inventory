"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { LineChart } from "@/components/charts/line-chart";
import { useToast } from "@/components/layout/toast";
import { rp, rpShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReportData } from "@/lib/queries/reports";
import { BarChart3 } from "lucide-react";

export function LaporanClient({ data }: { data: ReportData }) {
  const [range, setRange] = useState<6 | 12>(12);
  const { toast } = useToast();

  const volume = data.monthlyVolume.slice(-range);
  const rateTrend = data.approvalRateTrend.slice(-range);

  const m = data.metrics;

  return (
    <div className="space-y-6">
      {/* Export toolbar */}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<FileSpreadsheet className="h-4 w-4" />}
          onClick={() => toast("Export Excel akan segera hadir.", "info")}
        >
          Export Excel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-4 w-4" />}
          onClick={() => toast("Export PDF akan segera hadir.", "info")}
        >
          Export PDF
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Permintaan Bulan Ini"
          value={m.monthRequests}
          trend={m.trends.monthRequests}
          accent="amber"
        />
        <MetricCard
          label="Approval Rate"
          value={m.approvalRate}
          suffix="%"
          accent="sage"
          hint="Dari seluruh keputusan"
        />
        <MetricCard
          label="Rata-rata Proses"
          value={m.avgProcessingDays}
          suffix="hari"
          accent="navy"
          hint="Permintaan selesai"
        />
        <MetricCard
          label="Total Pengadaan"
          value={rpShort(m.totalProcurement)}
          accent="rust"
        />
      </div>

      {/* Bar chart */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display-serif text-xl">Volume Permintaan Bulanan</h2>
          <div className="flex gap-1 rounded-md border border-line p-0.5">
            {([6, 12] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  range === r
                    ? "bg-amber-sf text-amber-dk"
                    : "text-ink-mute hover:text-ink",
                )}
              >
                {r}B
              </button>
            ))}
          </div>
        </div>
        <BarChart data={volume} />
      </Card>

      {/* Donut + Line */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="display-serif mb-5 text-xl">Distribusi per Kategori</h2>
          {data.categoryDistribution.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="Belum ada data"
            />
          ) : (
            <DonutChart
              data={data.categoryDistribution.map((d) => ({
                label: d.category,
                value: d.count,
              }))}
              centerLabel="item"
            />
          )}
        </Card>
        <Card>
          <h2 className="display-serif mb-5 text-xl">Trend Approval Rate</h2>
          <LineChart
            data={rateTrend.map((d) => ({ label: d.label, value: d.rate }))}
          />
        </Card>
      </div>

      {/* Top requesters */}
      <Card padless>
        <div className="border-b border-line px-6 py-4">
          <h2 className="display-serif text-xl">Top Pemohon</h2>
        </div>
        {data.topRequesters.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Belum ada data pemohon"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow px-5 py-3 text-ink-mute">#</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Nama</th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Divisi</th>
                  <th className="eyebrow px-5 py-3 text-right text-ink-mute">
                    Permintaan
                  </th>
                  <th className="eyebrow px-5 py-3 text-ink-mute">Approval</th>
                  <th className="eyebrow px-5 py-3 text-right text-ink-mute">
                    Total Nilai
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topRequesters.map((u, i) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3 font-mono text-ink-mute">{i + 1}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <span className="text-ink">{u.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {u.division ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{u.count}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full bg-sage"
                            style={{ width: `${u.approvalRate}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs text-ink-mute">
                          {u.approvalRate}%
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs">
                      {rp(u.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
