import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 1x1 transparent PNG — placeholder digital signature for seeded SIGNED DNs.
const SIG_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

function computeStockStatus(currentStock: number, minStock: number) {
  if (currentStock <= 0) return "EMPTY" as const;
  if (currentStock < minStock) return "LOW" as const;
  return "OK" as const;
}

async function main() {
  console.log("🌱 Seeding AssetFlow…");

  // ── Reset (children → parents) ──────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deliveryNoteItem.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.requestTimeline.deleteMany();
  await prisma.requestItem.deleteMany();
  await prisma.assetRequest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ── 1. Users (5) ────────────────────────────────────────
  const usersData = [
    { email: "budi@handal.co.id", name: "Budi Aryanto", role: "KARYAWAN", division: "IT Support", avatarColor: "navy" },
    { email: "sari@handal.co.id", name: "Sari Wulandari", role: "KARYAWAN", division: "Marketing", avatarColor: "rust" },
    { email: "siti@handal.co.id", name: "Siti Rahayu", role: "ADMIN_ASET", division: "General Affairs", avatarColor: "amber" },
    { email: "bambang@handal.co.id", name: "Bambang Sudirman", role: "MANAGER", division: "IT Support", avatarColor: "sage" },
    { email: "diana@handal.co.id", name: "Diana Putri", role: "MANAGER", division: "Marketing", avatarColor: "amber" },
  ] as const;

  const users: Record<string, { id: string; name: string }> = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        division: u.division,
        avatarColor: u.avatarColor,
      },
    });
    users[u.email] = { id: created.id, name: created.name };
  }
  const budi = users["budi@handal.co.id"];
  const sari = users["sari@handal.co.id"];
  const siti = users["siti@handal.co.id"];
  const bambang = users["bambang@handal.co.id"];
  const diana = users["diana@handal.co.id"];

  // ── 2. Categories (6) ───────────────────────────────────
  const catNames = ["Laptop", "Monitor", "Mouse", "Keyboard", "Kabel HDMI", "Headset"];
  const cat: Record<string, string> = {};
  for (const name of catNames) {
    const c = await prisma.assetCategory.create({ data: { name } });
    cat[name] = c.id;
  }

  // ── 3. Inventory (12) ───────────────────────────────────
  const inventoryData = [
    { category: "Laptop", itemName: "Laptop Lenovo ThinkPad E14", currentStock: 5, minStock: 3, unit: "unit", price: 12000000 },
    { category: "Laptop", itemName: "Laptop Asus VivoBook", currentStock: 2, minStock: 3, unit: "unit", price: 9500000 },
    { category: "Monitor", itemName: "Monitor LG 24 inch", currentStock: 8, minStock: 4, unit: "unit", price: 1800000 },
    { category: "Monitor", itemName: "Monitor Dell 27 inch", currentStock: 0, minStock: 2, unit: "unit", price: 3200000 },
    { category: "Mouse", itemName: "Mouse Logitech M331", currentStock: 25, minStock: 10, unit: "pcs", price: 250000 },
    { category: "Mouse", itemName: "Mouse Wireless Generic", currentStock: 4, minStock: 5, unit: "pcs", price: 120000 },
    { category: "Keyboard", itemName: "Keyboard Logitech K380", currentStock: 15, minStock: 8, unit: "pcs", price: 450000 },
    { category: "Keyboard", itemName: "Keyboard Mekanikal Keychron", currentStock: 6, minStock: 4, unit: "pcs", price: 1200000 },
    { category: "Kabel HDMI", itemName: "Kabel HDMI 1.5m", currentStock: 30, minStock: 15, unit: "pcs", price: 75000 },
    { category: "Kabel HDMI", itemName: "Kabel HDMI 3m", currentStock: 12, minStock: 10, unit: "pcs", price: 120000 },
    { category: "Headset", itemName: "Headset Logitech H390", currentStock: 10, minStock: 5, unit: "pcs", price: 550000 },
    { category: "Headset", itemName: "Headset Jabra Evolve 20", currentStock: 1, minStock: 4, unit: "pcs", price: 1350000 },
  ];
  for (const i of inventoryData) {
    await prisma.inventory.create({
      data: {
        categoryId: cat[i.category],
        itemName: i.itemName,
        currentStock: i.currentStock,
        minStock: i.minStock,
        unit: i.unit,
        price: new Prisma.Decimal(i.price),
        status: computeStockStatus(i.currentStock, i.minStock),
      },
    });
  }

  // ── 4. Assets (12) ──────────────────────────────────────
  const assetsData = [
    { code: "AST-2025-00001", name: "Laptop Lenovo ThinkPad E14", category: "Laptop", status: "IN_USE", assigned: budi.id, location: "Lantai 3 - IT Support", since: daysAgo(140) },
    { code: "AST-2025-00002", name: "Laptop Asus VivoBook", category: "Laptop", status: "IN_USE", assigned: sari.id, location: "Lantai 2 - Marketing", since: daysAgo(120) },
    { code: "AST-2025-00003", name: "Monitor LG 24 inch", category: "Monitor", status: "IN_USE", assigned: budi.id, location: "Lantai 3 - IT Support", since: daysAgo(140) },
    { code: "AST-2025-00004", name: "Monitor Dell 27 inch", category: "Monitor", status: "AVAILABLE", assigned: null, location: "Gudang GA", since: daysAgo(80) },
    { code: "AST-2025-00005", name: "Mouse Logitech M331", category: "Mouse", status: "IN_USE", assigned: sari.id, location: "Lantai 2 - Marketing", since: daysAgo(120) },
    { code: "AST-2025-00006", name: "Keyboard Logitech K380", category: "Keyboard", status: "AVAILABLE", assigned: null, location: "Gudang GA", since: daysAgo(80) },
    { code: "AST-2025-00007", name: "Headset Logitech H390", category: "Headset", status: "MAINTENANCE", assigned: null, location: "Servis Vendor", since: daysAgo(200) },
    { code: "AST-2025-00008", name: "Laptop Lenovo ThinkPad E14", category: "Laptop", status: "AVAILABLE", assigned: null, location: "Gudang GA", since: daysAgo(60) },
    { code: "AST-2025-00009", name: "Monitor LG 24 inch", category: "Monitor", status: "IN_USE", assigned: bambang.id, location: "Lantai 3 - IT Support", since: daysAgo(180) },
    { code: "AST-2025-00010", name: "Keyboard Mekanikal Keychron", category: "Keyboard", status: "IN_USE", assigned: bambang.id, location: "Lantai 3 - IT Support", since: daysAgo(180) },
    { code: "AST-2025-00011", name: "Mouse Logitech M331", category: "Mouse", status: "DAMAGED", assigned: null, location: "Gudang GA", since: daysAgo(220) },
    { code: "AST-2025-00012", name: "Headset Jabra Evolve 20", category: "Headset", status: "IN_USE", assigned: diana.id, location: "Lantai 2 - Marketing", since: daysAgo(35) },
  ] as const;

  const assetByCode: Record<string, string> = {};
  for (const a of assetsData) {
    const created = await prisma.asset.create({
      data: {
        assetCode: a.code,
        qrCode: a.code,
        name: a.name,
        categoryId: cat[a.category],
        status: a.status,
        assignedToId: a.assigned,
        location: a.location,
        purchaseDate: a.since,
      },
    });
    assetByCode[a.code] = created.id;
  }

  // ── 5. Requests (8) + items + timeline ──────────────────
  type ReqSeed = {
    number: string;
    requester: { id: string; name: string };
    approver?: { id: string; name: string };
    reason: string;
    urgency: "RENDAH" | "NORMAL" | "TINGGI" | "KRITIKAL";
    status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PROCESSING" | "READY_TO_SIGN" | "COMPLETED";
    createdAt: Date;
    approvedAt?: Date;
    neededDate: Date;
    rejectReason?: string;
    items: { category: string; itemName: string; quantity: number; notes?: string }[];
    timeline: { label: string; actor: string; at: Date }[];
  };

  const requestSeeds: ReqSeed[] = [
    {
      number: "REQ-2025-0001",
      requester: budi,
      approver: bambang,
      reason: "Laptop lama sering hang dan baterai cepat habis, mengganggu pekerjaan support harian.",
      urgency: "NORMAL",
      status: "COMPLETED",
      createdAt: daysAgo(8),
      approvedAt: daysAgo(7),
      neededDate: daysAgo(3),
      items: [{ category: "Laptop", itemName: "Laptop Lenovo ThinkPad E14", quantity: 1, notes: "Spesifikasi i5/16GB" }],
      timeline: [
        { label: "Permintaan dikirim", actor: budi.name, at: daysAgo(8) },
        { label: "Disetujui oleh Bambang Sudirman", actor: bambang.name, at: daysAgo(7) },
        { label: "Diproses oleh Siti Rahayu", actor: siti.name, at: daysAgo(6) },
        { label: "Delivery Note diterbitkan", actor: siti.name, at: daysAgo(5) },
        { label: "Aset diterima & ditandatangani", actor: budi.name, at: daysAgo(4) },
      ],
    },
    {
      number: "REQ-2025-0002",
      requester: sari,
      reason: "Monitor tambahan dibutuhkan untuk pekerjaan desain materi marketing yang butuh layar lebar.",
      urgency: "TINGGI",
      status: "PENDING_APPROVAL",
      createdAt: daysAgo(2),
      neededDate: daysAhead(7),
      items: [
        { category: "Monitor", itemName: "Monitor Dell 27 inch", quantity: 1 },
        { category: "Mouse", itemName: "Mouse Logitech M331", quantity: 1 },
      ],
      timeline: [{ label: "Permintaan dikirim", actor: sari.name, at: daysAgo(2) }],
    },
    {
      number: "REQ-2025-0003",
      requester: budi,
      approver: bambang,
      reason: "Headset untuk keperluan call support dengan klien yang makin sering dilakukan online.",
      urgency: "NORMAL",
      status: "APPROVED",
      createdAt: daysAgo(4),
      approvedAt: daysAgo(3),
      neededDate: daysAhead(5),
      items: [{ category: "Headset", itemName: "Headset Logitech H390", quantity: 1 }],
      timeline: [
        { label: "Permintaan dikirim", actor: budi.name, at: daysAgo(4) },
        { label: "Disetujui oleh Bambang Sudirman", actor: bambang.name, at: daysAgo(3) },
      ],
    },
    {
      number: "REQ-2025-0004",
      requester: sari,
      approver: diana,
      reason: "Permintaan 2 laptop baru untuk anggota tim magang yang akan bergabung kuartal ini.",
      urgency: "RENDAH",
      status: "REJECTED",
      createdAt: daysAgo(6),
      approvedAt: daysAgo(5),
      neededDate: daysAhead(20),
      rejectReason: "Anggaran pengadaan kuartal ini sudah habis. Mohon ajukan kembali pada awal kuartal berikutnya.",
      items: [{ category: "Laptop", itemName: "Laptop Asus VivoBook", quantity: 2 }],
      timeline: [
        { label: "Permintaan dikirim", actor: sari.name, at: daysAgo(6) },
        { label: "Ditolak oleh Diana Putri", actor: diana.name, at: daysAgo(5) },
      ],
    },
    {
      number: "REQ-2025-0005",
      requester: budi,
      approver: bambang,
      reason: "Keyboard pengganti karena beberapa tombol pada keyboard lama sudah tidak berfungsi.",
      urgency: "NORMAL",
      status: "PROCESSING",
      createdAt: daysAgo(5),
      approvedAt: daysAgo(4),
      neededDate: daysAhead(3),
      items: [{ category: "Keyboard", itemName: "Keyboard Logitech K380", quantity: 1 }],
      timeline: [
        { label: "Permintaan dikirim", actor: budi.name, at: daysAgo(5) },
        { label: "Disetujui oleh Bambang Sudirman", actor: bambang.name, at: daysAgo(4) },
        { label: "Diproses oleh Siti Rahayu", actor: siti.name, at: daysAgo(3) },
      ],
    },
    {
      number: "REQ-2025-0006",
      requester: sari,
      approver: diana,
      reason: "Monitor untuk workstation baru di ruang kreatif marketing lantai 2.",
      urgency: "TINGGI",
      status: "READY_TO_SIGN",
      createdAt: daysAgo(3),
      approvedAt: daysAgo(2),
      neededDate: daysAhead(2),
      items: [{ category: "Monitor", itemName: "Monitor LG 24 inch", quantity: 1 }],
      timeline: [
        { label: "Permintaan dikirim", actor: sari.name, at: daysAgo(3) },
        { label: "Disetujui oleh Diana Putri", actor: diana.name, at: daysAgo(2) },
        { label: "Diproses oleh Siti Rahayu", actor: siti.name, at: daysAgo(1) },
        { label: "Delivery Note diterbitkan", actor: siti.name, at: daysAgo(1) },
      ],
    },
    {
      number: "REQ-2025-0007",
      requester: budi,
      approver: bambang,
      reason: "Tambahan kabel HDMI untuk ruang meeting IT yang baru dipasang proyektor.",
      urgency: "NORMAL",
      status: "COMPLETED",
      createdAt: daysAgo(10),
      approvedAt: daysAgo(9),
      neededDate: daysAgo(5),
      items: [{ category: "Kabel HDMI", itemName: "Kabel HDMI 3m", quantity: 2 }],
      timeline: [
        { label: "Permintaan dikirim", actor: budi.name, at: daysAgo(10) },
        { label: "Disetujui oleh Bambang Sudirman", actor: bambang.name, at: daysAgo(9) },
        { label: "Diproses oleh Siti Rahayu", actor: siti.name, at: daysAgo(8) },
        { label: "Delivery Note diterbitkan", actor: siti.name, at: daysAgo(7) },
        { label: "Aset diterima & ditandatangani", actor: budi.name, at: daysAgo(6) },
      ],
    },
    {
      number: "REQ-2025-0008",
      requester: sari,
      approver: diana,
      reason: "Penggantian mouse dan keyboard set untuk meja kerja di Marketing.",
      urgency: "NORMAL",
      status: "COMPLETED",
      createdAt: daysAgo(12),
      approvedAt: daysAgo(11),
      neededDate: daysAgo(7),
      items: [
        { category: "Mouse", itemName: "Mouse Logitech M331", quantity: 1 },
        { category: "Keyboard", itemName: "Keyboard Logitech K380", quantity: 1 },
      ],
      timeline: [
        { label: "Permintaan dikirim", actor: sari.name, at: daysAgo(12) },
        { label: "Disetujui oleh Diana Putri", actor: diana.name, at: daysAgo(11) },
        { label: "Diproses oleh Siti Rahayu", actor: siti.name, at: daysAgo(10) },
        { label: "Delivery Note diterbitkan", actor: siti.name, at: daysAgo(9) },
        { label: "Aset diterima & ditandatangani", actor: sari.name, at: daysAgo(8) },
      ],
    },
  ];

  const reqByNumber: Record<string, string> = {};
  for (const r of requestSeeds) {
    const created = await prisma.assetRequest.create({
      data: {
        requestNumber: r.number,
        requesterId: r.requester.id,
        approvedById: r.approver?.id ?? null,
        approvedAt: r.approvedAt ?? null,
        reason: r.reason,
        urgency: r.urgency,
        status: r.status,
        neededDate: r.neededDate,
        rejectReason: r.rejectReason ?? null,
        createdAt: r.createdAt,
        items: {
          create: r.items.map((it) => ({
            categoryId: cat[it.category],
            itemName: it.itemName,
            quantity: it.quantity,
            notes: it.notes ?? null,
          })),
        },
        timeline: {
          create: r.timeline.map((t) => ({ label: t.label, actor: t.actor, at: t.at })),
        },
      },
    });
    reqByNumber[r.number] = created.id;
  }

  // ── 6. Delivery Notes (5) + items ───────────────────────
  type DnSeed = {
    number: string;
    request: string;
    recipient: { id: string };
    status: "DRAFT" | "READY_TO_SIGN" | "SIGNED" | "ARCHIVED";
    assets: string[];
    signed?: Date;
    createdAt: Date;
  };
  const dnSeeds: DnSeed[] = [
    { number: "DN-2025-0001", request: "REQ-2025-0001", recipient: budi, status: "SIGNED", assets: ["AST-2025-00001"], signed: daysAgo(4), createdAt: daysAgo(5) },
    { number: "DN-2025-0002", request: "REQ-2025-0006", recipient: sari, status: "READY_TO_SIGN", assets: ["AST-2025-00004"], createdAt: daysAgo(1) },
    { number: "DN-2025-0003", request: "REQ-2025-0007", recipient: budi, status: "SIGNED", assets: ["AST-2025-00003"], signed: daysAgo(6), createdAt: daysAgo(7) },
    { number: "DN-2025-0004", request: "REQ-2025-0008", recipient: sari, status: "SIGNED", assets: ["AST-2025-00005"], signed: daysAgo(8), createdAt: daysAgo(9) },
    { number: "DN-2025-0005", request: "REQ-2025-0005", recipient: budi, status: "DRAFT", assets: ["AST-2025-00006"], createdAt: daysAgo(2) },
  ];
  for (const d of dnSeeds) {
    await prisma.deliveryNote.create({
      data: {
        dnNumber: d.number,
        requestId: reqByNumber[d.request],
        recipientId: d.recipient.id,
        createdById: siti.id,
        status: d.status,
        signatureData: d.signed ? SIG_PNG : null,
        signedAt: d.signed ?? null,
        createdAt: d.createdAt,
        items: {
          create: d.assets.map((code) => ({ assetId: assetByCode[code] })),
        },
      },
    });
  }

  // ── 7. Purchase Orders (4) ──────────────────────────────
  const poSeeds = [
    { number: "PO-2025-0001", supplier: "PT Sumber Komputer Sejahtera", status: "DRAFT", itemCount: 2, total: 19000000, expectedAt: daysAhead(14), notes: "Pengadaan untuk restock laptop yang menipis.", createdAt: daysAgo(3) },
    { number: "PO-2025-0002", supplier: "CV Mitra Teknologi", status: "APPROVED", itemCount: 2, total: 6400000, expectedAt: daysAhead(10), notes: "Tambahan monitor Dell yang stoknya habis.", createdAt: daysAgo(6) },
    { number: "PO-2025-0003", supplier: "Toko Elektronik Jaya", status: "IN_PROGRESS", itemCount: 3, total: 2700000, expectedAt: daysAhead(4), notes: "Restock mouse & kabel HDMI.", createdAt: daysAgo(9) },
    { number: "PO-2025-0004", supplier: "PT Sumber Komputer Sejahtera", status: "RECEIVED", itemCount: 4, total: 5400000, expectedAt: daysAgo(2), receivedAt: daysAgo(1), notes: "Headset & keyboard untuk tim baru.", createdAt: daysAgo(15) },
  ] as const;
  for (const p of poSeeds) {
    await prisma.purchaseOrder.create({
      data: {
        poNumber: p.number,
        supplier: p.supplier,
        status: p.status,
        itemCount: p.itemCount,
        totalCost: new Prisma.Decimal(p.total),
        expectedAt: p.expectedAt,
        receivedAt: "receivedAt" in p ? (p.receivedAt as Date) : null,
        notes: p.notes,
        createdAt: p.createdAt,
      },
    });
  }

  // ── 8. Notifications (5) ────────────────────────────────
  const notifSeeds = [
    { user: bambang.id, type: "NEW_REQUEST", title: "Permintaan baru menunggu approval", message: "Sari Wulandari mengajukan permintaan REQ-2025-0002 (Monitor & Mouse).", isRead: false, entity: reqByNumber["REQ-2025-0002"], createdAt: daysAgo(2) },
    { user: diana.id, type: "NEW_REQUEST", title: "Permintaan baru menunggu approval", message: "Sari Wulandari mengajukan permintaan REQ-2025-0002.", isRead: false, entity: reqByNumber["REQ-2025-0002"], createdAt: daysAgo(2) },
    { user: budi.id, type: "APPROVED", title: "Permintaan disetujui", message: "Permintaan REQ-2025-0003 Anda telah disetujui oleh Bambang Sudirman.", isRead: true, entity: reqByNumber["REQ-2025-0003"], createdAt: daysAgo(3) },
    { user: sari.id, type: "REJECTED", title: "Permintaan ditolak", message: "Permintaan REQ-2025-0004 Anda ditolak. Lihat alasan di detail permintaan.", isRead: false, entity: reqByNumber["REQ-2025-0004"], createdAt: daysAgo(5) },
    { user: siti.id, type: "LOW_STOCK", title: "Stok aset menipis", message: "Monitor Dell 27 inch sudah habis (0 unit). Pertimbangkan pengadaan.", isRead: false, entity: null, createdAt: daysAgo(1) },
  ] as const;
  for (const n of notifSeeds) {
    await prisma.notification.create({
      data: {
        userId: n.user,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        entityId: n.entity,
        createdAt: n.createdAt,
      },
    });
  }

  console.log("✅ Seed selesai:");
  console.log(`   • ${usersData.length} users  • ${catNames.length} categories  • ${inventoryData.length} inventory`);
  console.log(`   • ${assetsData.length} assets  • ${requestSeeds.length} requests  • ${dnSeeds.length} delivery notes`);
  console.log(`   • ${poSeeds.length} purchase orders  • ${notifSeeds.length} notifications`);
  console.log("   Login demo: budi@handal.co.id / sari@handal.co.id / siti@handal.co.id / bambang@handal.co.id / diana@handal.co.id");
  console.log("   Password (semua): password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
