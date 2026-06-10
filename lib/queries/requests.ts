import { prisma } from "@/lib/prisma";
import type { RequestStatus, Urgency } from "@prisma/client";

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
  return prisma.assetRequest.findUnique({
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
      items: { include: { category: { select: { name: true } } } },
      timeline: { orderBy: { at: "asc" } },
      deliveryNote: { select: { id: true, dnNumber: true, status: true } },
    },
  });
}

export type RequestDetail = NonNullable<
  Awaited<ReturnType<typeof getRequestDetail>>
>;

/** Manager approval queue — pending requests. */
export async function getApprovalQueue() {
  return prisma.assetRequest.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "asc" },
    include: {
      requester: {
        select: { id: true, name: true, division: true, avatarColor: true },
      },
      items: { include: { category: { select: { name: true } } } },
    },
  });
}

/** Manager approval history — decided requests (approved or rejected). */
export async function getApprovalHistory(
  filter: "ALL" | "APPROVED" | "REJECTED" = "ALL",
) {
  const where: Record<string, unknown> = { approvedAt: { not: null } };
  if (filter === "REJECTED") where.status = "REJECTED";
  if (filter === "APPROVED") where.status = { not: "REJECTED" };

  const rows = await prisma.assetRequest.findMany({
    where,
    orderBy: { approvedAt: "desc" },
    include: {
      requester: { select: { name: true, division: true, avatarColor: true } },
      approver: { select: { name: true } },
      items: { select: { itemName: true, quantity: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    decision: (r.status === "REJECTED" ? "REJECTED" : "APPROVED") as
      | "APPROVED"
      | "REJECTED",
  }));
}

/** Admin processing queue grouped by stage (PLAN §8.2 tabs). */
export async function getAdminQueue() {
  const rows = await prisma.assetRequest.findMany({
    where: { status: { in: ["APPROVED", "PROCESSING", "READY_TO_SIGN"] } },
    orderBy: { approvedAt: "asc" },
    include: {
      requester: {
        select: { id: true, name: true, division: true, avatarColor: true },
      },
      items: { include: { category: { select: { name: true } } } },
      deliveryNote: { select: { id: true, dnNumber: true, status: true } },
    },
  });

  return {
    perluProses: rows.filter((r) => r.status === "APPROVED"),
    sedangProses: rows.filter((r) => r.status === "PROCESSING"),
    menungguTtd: rows.filter((r) => r.status === "READY_TO_SIGN"),
  };
}
