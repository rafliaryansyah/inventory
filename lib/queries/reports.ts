import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function monthBuckets(n: number) {
  const now = new Date();
  const out: { year: number; month: number; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("id-ID", { month: "short" }),
    });
  }
  return out;
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export type ReportData = {
  metrics: {
    monthRequests: number;
    approvalRate: number;
    avgProcessingDays: number;
    totalProcurement: number;
    trends: {
      monthRequests: number | null;
      approvalRate: number | null;
    };
  };
  monthlyVolume: { label: string; approved: number; rejected: number }[];
  categoryDistribution: { category: string; count: number }[];
  approvalRateTrend: { label: string; rate: number }[];
  topRequesters: {
    id: string;
    name: string;
    division: string | null;
    avatarColor: string | null;
    count: number;
    approvalRate: number;
    totalValue: number;
  }[];
};

/** Manager analytics (PLAN §8.3) — aggregated from real data. */
export async function getReportData(): Promise<ReportData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [requests, purchaseOrders, inventory] = await Promise.all([
    prisma.assetRequest.findMany({
      include: {
        items: { include: { category: { select: { name: true } } } },
        requester: {
          select: { id: true, name: true, division: true, avatarColor: true },
        },
      },
    }),
    prisma.purchaseOrder.findMany({ select: { totalCost: true } }),
    prisma.inventory.findMany({ select: { itemName: true, price: true } }),
  ]);

  // Price lookup by item name for value estimation.
  const priceByItem = new Map<string, number>();
  for (const inv of inventory) {
    priceByItem.set(inv.itemName.toLowerCase(), Number(inv.price));
  }
  const itemValue = (name: string, qty: number) =>
    (priceByItem.get(name.toLowerCase()) ?? 0) * qty;

  const decided = requests.filter((r) => r.approvedAt !== null);
  const approved = decided.filter((r) => r.status !== "REJECTED");

  // ── Metrics ──
  const monthRequests = requests.filter(
    (r) => r.createdAt >= monthStart,
  ).length;
  const lastMonthRequests = requests.filter(
    (r) => r.createdAt >= lastMonthStart && r.createdAt < monthStart,
  ).length;

  const approvalRate = pct(approved.length, decided.length);

  const completed = requests.filter((r) => r.status === "COMPLETED");
  const avgProcessingDays =
    completed.length > 0
      ? Math.round(
          (completed.reduce(
            (sum, r) =>
              sum + (r.updatedAt.getTime() - r.createdAt.getTime()) / MS_PER_DAY,
            0,
          ) /
            completed.length) *
            10,
        ) / 10
      : 0;

  const totalProcurement = purchaseOrders.reduce(
    (sum, p) => sum + Number(p.totalCost),
    0,
  );

  // ── Monthly volume (12 months) ──
  const buckets = monthBuckets(12);
  const monthlyVolume = buckets.map((b) => {
    const inMonth = decided.filter((r) => {
      const d = r.approvedAt!;
      return d.getFullYear() === b.year && d.getMonth() === b.month;
    });
    return {
      label: b.label,
      approved: inMonth.filter((r) => r.status !== "REJECTED").length,
      rejected: inMonth.filter((r) => r.status === "REJECTED").length,
    };
  });

  // ── Approval rate trend (per month) ──
  const approvalRateTrend = monthlyVolume.map((m) => ({
    label: m.label,
    rate: pct(m.approved, m.approved + m.rejected),
  }));

  // ── Category distribution ──
  const catCount = new Map<string, number>();
  for (const r of requests) {
    for (const it of r.items) {
      const name = it.category?.name ?? "Lainnya";
      catCount.set(name, (catCount.get(name) ?? 0) + 1);
    }
  }
  const categoryDistribution = [...catCount.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // ── Top requesters ──
  const byUser = new Map<
    string,
    {
      id: string;
      name: string;
      division: string | null;
      avatarColor: string | null;
      total: number;
      decided: number;
      approved: number;
      value: number;
    }
  >();
  for (const r of requests) {
    const u = r.requester;
    const e =
      byUser.get(u.id) ??
      {
        id: u.id,
        name: u.name,
        division: u.division,
        avatarColor: u.avatarColor,
        total: 0,
        decided: 0,
        approved: 0,
        value: 0,
      };
    e.total += 1;
    if (r.approvedAt) {
      e.decided += 1;
      if (r.status !== "REJECTED") e.approved += 1;
    }
    for (const it of r.items) e.value += itemValue(it.itemName, it.quantity);
    byUser.set(u.id, e);
  }
  const topRequesters = [...byUser.values()]
    .map((e) => ({
      id: e.id,
      name: e.name,
      division: e.division,
      avatarColor: e.avatarColor,
      count: e.total,
      approvalRate: pct(e.approved, e.decided),
      totalValue: e.value,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    metrics: {
      monthRequests,
      approvalRate,
      avgProcessingDays,
      totalProcurement,
      trends: {
        monthRequests:
          lastMonthRequests > 0
            ? Math.round(
                ((monthRequests - lastMonthRequests) / lastMonthRequests) * 100,
              )
            : null,
        approvalRate: null,
      },
    },
    monthlyVolume,
    categoryDistribution,
    approvalRateTrend,
    topRequesters,
  };
}
