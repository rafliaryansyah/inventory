// Document number generators: REQ-/DN-/PO-/AST-.
// Each scans the latest number for the current year and increments.

import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type Client = PrismaClient | Prisma.TransactionClient;

function build(prefix: string, last: string | null, pad: number): string {
  const n = last ? parseInt(last.slice(prefix.length), 10) + 1 : 1;
  const safe = Number.isFinite(n) ? n : 1;
  return `${prefix}${String(safe).padStart(pad, "0")}`;
}

export async function generateRequestNumber(client: Client = prisma): Promise<string> {
  const prefix = `REQ-${new Date().getFullYear()}-`;
  const last = await client.assetRequest.findFirst({
    where: { requestNumber: { startsWith: prefix } },
    orderBy: { requestNumber: "desc" },
    select: { requestNumber: true },
  });
  return build(prefix, last?.requestNumber ?? null, 4);
}

export async function generateDnNumber(client: Client = prisma): Promise<string> {
  const prefix = `DN-${new Date().getFullYear()}-`;
  const last = await client.deliveryNote.findFirst({
    where: { dnNumber: { startsWith: prefix } },
    orderBy: { dnNumber: "desc" },
    select: { dnNumber: true },
  });
  return build(prefix, last?.dnNumber ?? null, 4);
}

export async function generatePoNumber(client: Client = prisma): Promise<string> {
  const prefix = `PO-${new Date().getFullYear()}-`;
  const last = await client.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
    select: { poNumber: true },
  });
  return build(prefix, last?.poNumber ?? null, 4);
}

export async function generateAssetCode(client: Client = prisma): Promise<string> {
  const prefix = `AST-${new Date().getFullYear()}-`;
  const last = await client.asset.findFirst({
    where: { assetCode: { startsWith: prefix } },
    orderBy: { assetCode: "desc" },
    select: { assetCode: true },
  });
  return build(prefix, last?.assetCode ?? null, 5);
}
