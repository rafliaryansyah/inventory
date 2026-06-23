import { prisma } from "@/lib/prisma";
import type { Prisma, RequestStatus, Urgency } from "@prisma/client";

/** Konversi Decimal `unitPrice` tiap item → number agar bisa di-serialize ke Client Component. */
function withItemPrice<T extends { unitPrice: Prisma.Decimal | null }>(it: T) {
  return { ...it, unitPrice: it.unitPrice == null ? null : Number(it.unitPrice) };
}

export type RequestFilters = {
  search?: string;
  status?: string;
  urgency?: string;
};

function buildWhere(filters?: RequestFilters) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status as RequestStatus;
  if (filters?.urgency) where.urgency = filters.urgency as Urgency;
  if (filters?.search) {
    where.OR = [
      { requestNumber: { contains: filters.search, mode: "insensitive" } },
      {
        items: {
          some: { itemName: { contains: filters.search, mode: "insensitive" } },
        },
      },
    ];
  }
  return where;
}

/** Permintaan Saya — list for the logged-in employee. */
export async function getMyRequests(userId: string, filters?: RequestFilters) {
  return prisma.assetRequest.findMany({
    where: { requesterId: userId, ...buildWhere(filters) },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { itemName: true, quantity: true } } },
  });
}

/** Full detail for the Request Detail modal. */
export async function getRequestDetail(id: string) {
  const row = await prisma.assetRequest.findUnique({
    where: { id },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          division: true,
          avatarColor: true,
          email: true,
        },
      },
      approver: { select: { name: true } },
      hrdApprover: { select: { name: true } },
      items: {
        include: {
          category: { select: { name: true } },
          asset: { select: { assetCode: true, name: true } },
        },
      },
      timeline: { orderBy: { at: "asc" } },
      deliveryNote: {
        select: { id: true, dnNumber: true, status: true, signedAt: true },
      },
    },
  });
  if (!row) return null;
  return { ...row, items: row.items.map(withItemPrice) };
}

export type RequestDetail = NonNullable<
  Awaited<ReturnType<typeof getRequestDetail>>
>;

/** Manager approval queue — pending requests. */
export async function getApprovalQueue() {
  const rows = await prisma.assetRequest.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "asc" },
    include: {
      requester: {
        select: { id: true, name: true, division: true, avatarColor: true },
      },
      items: { include: { category: { select: { name: true } } } },
    },
  });
  return rows.map((r) => ({ ...r, items: r.items.map(withItemPrice) }));
}

/** HRD approval queue — requests approved by Manager, awaiting HRD. */
export async function getHrdApprovalQueue() {
  const rows = await prisma.assetRequest.findMany({
    where: { status: "PENDING_HRD" },
    orderBy: { approvedAt: "asc" },
    include: {
      requester: {
        select: { id: true, name: true, division: true, avatarColor: true },
      },
      items: { include: { category: { select: { name: true } } } },
    },
  });
  return rows.map((r) => ({ ...r, items: r.items.map(withItemPrice) }));
}

/** Manager approval history — what the Manager decided (layer 1). */
export async function getApprovalHistory(
  filter: "ALL" | "APPROVED" | "REJECTED" = "ALL",
) {
  // Manager bertindak jika approvedAt ada (approve → diteruskan, atau reject).
  const rows = await prisma.assetRequest.findMany({
    where: { approvedAt: { not: null } },
    orderBy: { approvedAt: "desc" },
    include: {
      requester: { select: { name: true, division: true, avatarColor: true } },
      approver: { select: { name: true } },
      items: { select: { itemName: true, quantity: true } },
    },
  });

  // Keputusan Manager: ditolak hanya jika Manager sendiri yang menolak
  // (status REJECTED & HRD belum bertindak). Jika HRD yang menolak,
  // dari sisi Manager permintaan itu tetap "disetujui".
  const mapped = rows.map((r) => ({
    ...r,
    decision: (r.status === "REJECTED" && r.hrdApprovedAt == null
      ? "REJECTED"
      : "APPROVED") as "APPROVED" | "REJECTED",
  }));
  return filter === "ALL" ? mapped : mapped.filter((r) => r.decision === filter);
}

/** HRD approval history — what HRD decided (layer 2). */
export async function getHrdApprovalHistory(
  filter: "ALL" | "APPROVED" | "REJECTED" = "ALL",
) {
  const rows = await prisma.assetRequest.findMany({
    where: { hrdApprovedAt: { not: null } },
    orderBy: { hrdApprovedAt: "desc" },
    include: {
      requester: { select: { name: true, division: true, avatarColor: true } },
      hrdApprover: { select: { name: true } },
      items: { select: { itemName: true, quantity: true } },
    },
  });

  const mapped = rows.map((r) => ({
    ...r,
    // Shape agar cocok dengan <RiwayatClient/>: pakai tanggal & alasan HRD.
    approvedAt: r.hrdApprovedAt,
    rejectReason: r.hrdRejectReason,
    decision: (r.status === "REJECTED" ? "REJECTED" : "APPROVED") as
      | "APPROVED"
      | "REJECTED",
  }));
  return filter === "ALL" ? mapped : mapped.filter((r) => r.decision === filter);
}

/** Admin processing queue grouped by stage (PLAN §8.2 tabs). */
export async function getAdminQueue() {
  const raw = await prisma.assetRequest.findMany({
    where: { status: { in: ["APPROVED", "PROCESSING", "READY_TO_SIGN"] } },
    orderBy: { approvedAt: "asc" },
    include: {
      requester: {
        select: { id: true, name: true, division: true, avatarColor: true },
      },
      items: {
        include: {
          category: { select: { name: true } },
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      deliveryNote: { select: { id: true, dnNumber: true, status: true } },
    },
  });
  const rows = raw.map((r) => ({ ...r, items: r.items.map(withItemPrice) }));

  return {
    perluProses: rows.filter((r) => r.status === "APPROVED"),
    sedangProses: rows.filter((r) => r.status === "PROCESSING"),
    menungguTtd: rows.filter((r) => r.status === "READY_TO_SIGN"),
  };
}
