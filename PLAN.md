# PLAN.md — AssetFlow

> **Blueprint teknis untuk Claude Code.** Sistem Informasi Manajemen Aset internal
> **PT Handal Informasi Teknologi**. Dokumen ini adalah sumber kebenaran tunggal
> (single source of truth) untuk eksekusi pembangunan aplikasi end-to-end.
>
> **Status**: Siap dieksekusi. Baca seluruh dokumen sebelum mulai. Ikuti urutan
> di bagian **§13 Implementation Phases** — jangan loncat fase karena ada dependency.

---

## 1. Ringkasan Proyek

AssetFlow mendigitalkan siklus permintaan & manajemen aset perusahaan yang
sebelumnya manual (Delivery Note fisik + Excel + OneNote). Alur inti:

```
Karyawan ajukan permintaan
   → Manager setujui / tolak
   → Admin Aset proses (cek stok / pengadaan bila perlu)
   → Admin terbitkan Delivery Note (DN)
   → Serah terima + tanda tangan digital
   → Aset tercatat di master register (dengan QR)
```

Satu aplikasi dipakai 3 role. Navigasi sidebar & landing page berubah sesuai
role pengguna yang login. Cakupan penuh: permintaan aset, inventori gudang,
purchase order (pengadaan), master aset dengan tracking QR, notifikasi,
audit log, dan analytics untuk manajemen.

### Konteks Bisnis (hasil wawancara)
- Proses lama: Delivery Note fisik, Excel, OneNote — tidak ada asset ID/barcode,
  tidak ada jadwal maintenance, pelaporan kerusakan via chat.
- Tidak ada divisi aset khusus (hanya 2 pegawai merangkap di General Affairs).
- Butuh role-based access. Tidak butuh integrasi SSO. Security tingkat standar.
- Prioritas: penting tapi tidak mendesak → kualitas > kecepatan, tapi tetap realistis.

---

## 2. Goals & Non-Goals

### Goals (MVP penuh — semua harus jadi)
- [x] Auth role-based (Karyawan / Admin Aset / Manager) dengan NextAuth.
- [x] CRUD penuh 11 entitas (lihat §6 skema).
- [x] Alur permintaan lengkap: submit → approve/reject → process → DN → TTD digital → completed.
- [x] Modul inventori dengan auto-status stok (OK/LOW/EMPTY).
- [x] Modul pengadaan (Purchase Order).
- [x] Master aset dengan QR code + transfer kepemilikan.
- [x] Delivery Note dengan tanda tangan digital (canvas → base64 PNG).
- [x] Notifikasi in-app + audit log untuk aksi penting.
- [x] Laporan & analytics (metric + chart) untuk Manager.
- [x] UI persis design system AssetFlow (editorial, warm, Fraunces+Jakarta+Mono).
- [x] Responsive (sidebar off-canvas di mobile, modal jadi bottom sheet).

### Non-Goals (eksplisit TIDAK dikerjakan di fase ini)
- ❌ Supabase Auth (kita pakai NextAuth — Supabase murni sebagai PostgreSQL).
- ❌ Row Level Security (RLS) — otorisasi di layer aplikasi (middleware + action guards).
- ❌ Supabase Storage — PDF DN di-generate on-demand, signature disimpan base64 di DB.
- ❌ Supabase Realtime — notifikasi pakai refetch/revalidation, bukan websocket.
- ❌ SSO / OAuth provider eksternal.
- ❌ Mobile native app, multi-bahasa (UI Indonesia saja), multi-tenant.

---

## 3. Tech Stack (versi spesifik)

| Layer            | Pilihan                          | Catatan |
|------------------|----------------------------------|---------|
| Framework        | **Next.js 15** (App Router)      | RSC + Server Actions |
| Bahasa           | **TypeScript** (strict)          | Semua file `.ts`/`.tsx` |
| Styling          | **Tailwind CSS v3**              | Config token persis design system (§5) |
| Database         | **Supabase PostgreSQL**          | Dipakai sebagai PostgreSQL murni |
| ORM              | **Prisma 5**                     | `prisma db push` / `migrate` + `seed` |
| Auth             | **NextAuth.js v5 (Auth.js)**     | Credentials provider, JWT session |
| Password hash    | **bcryptjs**                     | salt rounds 10 |
| Validasi         | **Zod**                          | Schema dipakai di form + server action |
| Form             | **React Hook Form**              | + `@hookform/resolvers/zod` |
| Icon             | **lucide-react**                 | Ganti wrapper `window.Icon` prototype |
| Chart            | **Custom SVG** (port `charts.jsx`)| Tidak perlu chart lib eksternal |
| Mutasi data      | **Server Actions**              | Bukan REST API routes |
| State server     | **revalidatePath / revalidateTag**| Tidak pakai react-query |

> **Kenapa Server Actions, bukan REST:** user minta "paling cepat". Server Actions
> menghapus boilerplate API route + fetch client. Mutasi langsung dipanggil dari
> komponen, dengan `revalidatePath` untuk refresh data. Cocok untuk app internal.

---

## 4. Arsitektur & Struktur Folder

Prototype memakai pola throwaway (Babel in-browser, `window` globals, CDN). **Jangan
copy verbatim** — rekreasi di arsitektur produksi berikut:

```
asset-flow/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                 # Halaman login (Credentials)
│   ├── (app)/                           # Grup terproteksi (butuh auth)
│   │   ├── layout.tsx                   # App shell: Sidebar + Topbar + Toast provider
│   │   ├── dashboard/page.tsx           # Dashboard Karyawan
│   │   ├── permintaan/
│   │   │   ├── page.tsx                 # Permintaan Saya (list)
│   │   │   └── baru/page.tsx            # Form Permintaan
│   │   ├── antrian/page.tsx             # Admin: Antrian Proses
│   │   ├── inventori/page.tsx           # Admin: Inventori
│   │   ├── delivery-notes/page.tsx      # Admin: Delivery Notes
│   │   ├── pengadaan/page.tsx           # Admin: Purchase Orders
│   │   ├── master-aset/page.tsx         # Admin: Master Aset
│   │   ├── approval/page.tsx            # Manager: Antrian Approval
│   │   ├── riwayat/page.tsx             # Manager: Riwayat Approval
│   │   └── laporan/page.tsx             # Manager: Laporan & Analytics
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth handler
│   ├── layout.tsx                       # Root layout: font, <html lang="id">
│   └── globals.css                      # Base CSS + animasi + form styling (port index.html)
├── actions/                             # Server Actions (mutasi)
│   ├── auth.ts                          # (jika perlu helper)
│   ├── requests.ts                      # submit, approve, reject, updateStatus
│   ├── inventory.ts                     # adjustStock, createCategory
│   ├── assets.ts                        # register, transfer, setMaintenance
│   ├── delivery-notes.ts                # create, sign, archive
│   ├── purchase-orders.ts               # create, updateStatus, markReceived
│   └── notifications.ts                 # markAllRead, markRead
├── components/
│   ├── ui/                              # PORT dari ui.jsx → TSX
│   │   ├── badge.tsx  button.tsx  card.tsx  avatar.tsx
│   │   ├── page-header.tsx  metric-card.tsx  empty-state.tsx
│   │   ├── modal.tsx  field.tsx  tabs.tsx  timeline.tsx
│   ├── charts/                          # PORT dari charts.jsx
│   │   ├── bar-chart.tsx  donut-chart.tsx  line-chart.tsx
│   ├── modals/                          # PORT dari modals.jsx
│   │   ├── signature-modal.tsx  qr-scanner-modal.tsx
│   │   ├── reject-modal.tsx  request-detail-modal.tsx
│   │   └── notification-dropdown.tsx
│   ├── layout/
│   │   ├── sidebar.tsx  topbar.tsx  toast.tsx  toast-provider.tsx
│   └── features/                        # komponen client per halaman (interaktif)
│       ├── karyawan/  admin/  manager/
├── lib/
│   ├── prisma.ts                        # Prisma client singleton
│   ├── auth.ts                          # NextAuth config (authOptions)
│   ├── auth-guards.ts                   # requireRole() helper untuk server actions
│   ├── status.ts                        # STATUS_STYLES + label map (port dari ui.jsx)
│   ├── format.ts                        # rp(), rpShort(), date helpers
│   └── codegen.ts                       # generator nomor REQ/DN/PO/AST
├── lib/validations/
│   ├── request.ts  asset.ts  delivery-note.ts  purchase-order.ts
├── prisma/
│   ├── schema.prisma                    # §6
│   └── seed.ts                          # §12 — dari data.jsx
├── types/
│   └── index.ts                         # tipe turunan + view models
├── middleware.ts                        # Route guard by role (§7)
├── tailwind.config.ts                   # §5 token
├── .env.example
├── .env.local                           # (jangan commit)
└── package.json
```

### Pola Data Flow
- **Read**: Server Component memanggil fungsi query (pakai Prisma) langsung → render.
- **Write**: Client Component memanggil Server Action → mutasi Prisma → `revalidatePath` → UI refresh.
- **Auth**: `middleware.ts` cek session + role per route; Server Action panggil `requireRole()` sebagai guard lapis kedua.

---

## 5. Design System (port persis dari prototype)

> Sumber: `index.html` (Tailwind config + CSS) dan `ui.jsx`. Fidelity: **HIGH**.
> Rekreasi token PERSIS — ini sudah final dari Claude Design.

### 5.1 `tailwind.config.ts`
```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: "#F5F1E8",
        ink: "#1A1F2E",
        "ink-soft": "#4A5060",
        "ink-mute": "#7A8090",
        amber: "#B8842B",
        "amber-dk": "#8E6620",
        "amber-sf": "#F5DEBE",
        navy: "#1E3A5F",
        "navy-sf": "#DCE5F0",
        sage: "#5A7A5A",
        "sage-sf": "#D7EAD7",
        rust: "#A02F3E",
        "rust-sf": "#FBE9EC",
        paper: "#FFFFFF",
        line: "#E8E2D4",
        "line-dk": "#D9D2C0",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,31,46,0.04), 0 2px 8px rgba(26,31,46,0.04)",
        lift: "0 4px 12px rgba(26,31,46,0.08), 0 2px 4px rgba(26,31,46,0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 5.2 Fonts (via `next/font`)
Di `app/layout.tsx`, load Fraunces + Plus Jakarta Sans + JetBrains Mono dan expose
sebagai CSS variable (`--font-fraunces`, `--font-jakarta`, `--font-jetbrains`).
Set `lang="id"` di `<html>`.

```
Fraunces:        ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500
Plus Jakarta Sans: 400;500;600;700
JetBrains Mono:  400;500
```

### 5.3 `globals.css` (port dari `<style>` di index.html)
Pindahkan: base body styling, `.display-serif`, `.eyebrow`, custom scrollbar,
form input base styling (border-line, focus amber + ring), placeholder color,
keyframes (`fadeIn`/`slideUp`/`scaleIn`), `.anim-fade`/`.anim-slide`/`.anim-scale`,
`.hover-lift`, `.sig-canvas`. Persis seperti prototype.

### 5.4 Token referensi cepat

**Warna karakter**: editorial, warm, paper-like. Cream bg, white card, satu amber
brand accent, jewel tones (navy/sage/rust) khusus status. **No pure-black, no cool
gray, no gradient.**

**Typography**:
- `.display-serif` — Fraunces 500, `letter-spacing:-0.02em`, `line-height:1.05`. Page title 34–52px, metric value 44px. Accent word sering *italic amber*.
- `.eyebrow` — 11px, `letter-spacing:0.18em`, uppercase, weight 600. Kicker, table header, field label, badge.
- Mono (JetBrains): semua ID (REQ-/AST-/DN-/PO-), tanggal, qty, harga.

**Radius**: card/modal `rounded-lg`(8)/`rounded-xl`(12); button/input `rounded-md`(6); badge `rounded-sm`(2); avatar full.
**Card padding**: `p-6`; tabel pakai card padless dengan sel `px-5 py-3`.
**Content width**: `max-w-[1280px]` center, `px-5 md:px-8 py-8`.
**Shadow**: `soft` resting, `lift` hover (+`translateY(-2px)`), modal `shadow-2xl`.
**Motion**: fade 220ms, slide 260ms, scale 180ms; button `active:scale-[0.98]`; input focus ring `0 0 0 3px rgba(184,132,43,0.12)`.

### 5.5 Component library (port `ui.jsx` → `components/ui/*.tsx`)
Semua jadi komponen TypeScript dengan props typed. Daftar + perilaku:

| Komponen | Spec |
|----------|------|
| `Card` | `bg-paper border border-line rounded-lg shadow-soft p-6` (atau padless utk tabel). |
| `Button` | Varian: `primary`(amber) `secondary`(white+line, amber hover) `ghost` `navy` `sage` `rust`(filled) `danger`(white+rust border). Size `sm`/`md`/`lg`. Optional `icon`/`iconRight`. |
| `Badge` | Status pill `.eyebrow` di soft-fill chip `rounded-sm`. Pakai `STATUS_STYLES` (§5.6). |
| `Avatar` | Bulat, inisial Fraunces, `color` per user. Prop `size`. |
| `PageHeader` | eyebrow + serif title (accent word *italic amber*) + subtitle + actions kanan. |
| `MetricCard` | eyebrow label + trend pill (↑/↓ %) + value serif 44px + suffix + hint. Accent amber/navy/sage/rust. |
| `EmptyState` | Icon bulat tengah + serif title + body + optional action. |
| `Modal` | Center (bottom-sheet di mobile), overlay `bg-ink/40 backdrop-blur`, header (eyebrow+title+X), body scroll, footer actions kanan. Size sm/md/lg/xl. |
| `Field` | Label eyebrow (+ `*` rust kalau required) + control + hint. |
| `Tabs` | Underline tab, border aktif `amber`, optional count pill. |
| `Timeline` | Vertikal, rail kiri, dot amber utk step `done`; label/actor/timestamp mono. |

### 5.6 Status → Badge mapping (PERSIS — taruh di `lib/status.ts`)

| Kode | Label (ID) | Fill / Text |
|------|-----------|-------------|
| `PENDING_APPROVAL` | Menunggu Approval | amber-sf / amber-dk |
| `APPROVED` | Disetujui | sage-sf / sage |
| `REJECTED` | Ditolak | rust-sf / rust |
| `PROCESSING` | Diproses | navy-sf / navy |
| `READY_TO_SIGN` | Siap TTD | amber (solid) / paper |
| `COMPLETED` | Selesai | sage (solid) / paper |
| `DRAFT` | Draft | line / ink-soft |
| `SIGNED` | Ditandatangani | sage-sf / sage |
| `ARCHIVED` | Diarsip | line / ink-soft |
| `RECEIVED` | Diterima | sage-sf / sage |
| `OK` | OK | sage-sf / sage |
| `LOW` | Stok Rendah | amber-sf / amber-dk |
| `EMPTY` | Habis | rust-sf / rust |
| `IN_USE` | Digunakan | navy-sf / navy |
| `AVAILABLE` | Tersedia | sage-sf / sage |
| `MAINTENANCE` | Maintenance | amber-sf / amber-dk |
| `DAMAGED` | Rusak | rust-sf / rust |
| `RENDAH` | Rendah | line / ink-soft |
| `NORMAL` | Normal | navy-sf / navy |
| `TINGGI` | Tinggi | amber-sf / amber-dk |
| `KRITIKAL` | Kritikal | rust (solid) / paper |

### 5.7 Helper format (`lib/format.ts`)
- `rp(n)` → `"Rp " + n.toLocaleString("id-ID")` → `Rp 1.450.000`
- `rpShort(n)` → `Rp 1,5 Jt` / `Rp 14,5 M` (≥1e9 → M, ≥1e6 → Jt, ≥1e3 → rb)

---

## 6. Database — `prisma/schema.prisma`

Schema lengkap 11 tabel + 8 enum. Konsisten dengan ERD & `schema.sql` yang sudah dibuat.
Nama kolom DB `snake_case` (via `@map`), field Prisma `camelCase`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // pooled (pgbouncer :6543)
  directUrl = env("DIRECT_URL")         // direct (:5432) untuk migrate
}

// ─── ENUMS ───────────────────────────────────────────────
enum UserRole       { KARYAWAN ADMIN_ASET MANAGER }
enum Urgency        { RENDAH NORMAL TINGGI KRITIKAL }
enum RequestStatus  { PENDING_APPROVAL APPROVED REJECTED PROCESSING READY_TO_SIGN COMPLETED }
enum AssetStatus    { AVAILABLE IN_USE MAINTENANCE DAMAGED RETIRED }
enum StockStatus    { OK LOW EMPTY }
enum DnStatus       { DRAFT READY_TO_SIGN SIGNED ARCHIVED }
enum PoStatus       { DRAFT APPROVED IN_PROGRESS RECEIVED }
enum NotifType      { NEW_REQUEST APPROVED REJECTED DN_READY ASSET_RECEIVED LOW_STOCK }

// ─── MODELS ──────────────────────────────────────────────
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique @db.VarChar(255)
  name         String   @db.VarChar(100)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  role         UserRole
  division     String?  @db.VarChar(100)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  requestsMade     AssetRequest[] @relation("Requester")
  requestsApproved AssetRequest[] @relation("Approver")
  assetsAssigned   Asset[]        @relation("AssignedTo")
  dnReceived       DeliveryNote[] @relation("Recipient")
  dnCreated        DeliveryNote[] @relation("Creator")
  notifications    Notification[]
  auditLogs        AuditLog[]

  @@index([email])
  @@map("users")
}

model AssetCategory {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique @db.VarChar(100)
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  inventory    Inventory[]
  assets       Asset[]
  requestItems RequestItem[]

  @@map("asset_categories")
}

model Inventory {
  id           String      @id @default(uuid()) @db.Uuid
  categoryId   String      @map("category_id") @db.Uuid
  itemName     String      @map("item_name") @db.VarChar(200)
  currentStock Int         @default(0) @map("current_stock")
  minStock     Int         @default(0) @map("min_stock")
  status       StockStatus @default(OK)
  unit         String      @default("pcs") @db.VarChar(20)
  price        Decimal     @default(0) @db.Decimal(15, 2)
  updatedAt    DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  category AssetCategory @relation(fields: [categoryId], references: [id])

  @@unique([categoryId, itemName])
  @@index([status])
  @@map("inventory")
}

model AssetRequest {
  id            String        @id @default(uuid()) @db.Uuid
  requestNumber String        @unique @map("request_number") @db.VarChar(30)
  requesterId   String        @map("requester_id") @db.Uuid
  reason        String
  urgency       Urgency       @default(NORMAL)
  status        RequestStatus @default(PENDING_APPROVAL)
  neededDate    DateTime?     @map("needed_date") @db.Date
  approvedById  String?       @map("approved_by") @db.Uuid
  approvedAt    DateTime?     @map("approved_at") @db.Timestamptz
  rejectReason  String?       @map("reject_reason")
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  requester    User           @relation("Requester", fields: [requesterId], references: [id])
  approver     User?          @relation("Approver", fields: [approvedById], references: [id])
  items        RequestItem[]
  deliveryNote DeliveryNote?
  purchaseOrder PurchaseOrder?
  timeline     RequestTimeline[]

  @@index([status])
  @@index([requesterId])
  @@map("asset_requests")
}

// Tambahan vs schema.sql: timeline dinormalisasi jadi tabel sendiri
// (prototype menyimpannya sebagai array; di DB lebih bersih sebagai child rows)
model RequestTimeline {
  id        String   @id @default(uuid()) @db.Uuid
  requestId String   @map("request_id") @db.Uuid
  label     String   @db.VarChar(200)
  actor     String   @db.VarChar(100)
  at        DateTime @default(now()) @db.Timestamptz

  request AssetRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
  @@map("request_timeline")
}

model RequestItem {
  id         String  @id @default(uuid()) @db.Uuid
  requestId  String  @map("request_id") @db.Uuid
  categoryId String? @map("category_id") @db.Uuid
  itemName   String  @map("item_name") @db.VarChar(200)
  quantity   Int
  notes      String?

  request  AssetRequest   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  category AssetCategory? @relation(fields: [categoryId], references: [id])

  @@index([requestId])
  @@map("request_items")
}

model Asset {
  id           String      @id @default(uuid()) @db.Uuid
  assetCode    String      @unique @map("asset_code") @db.VarChar(30)
  name         String      @db.VarChar(200)
  categoryId   String      @map("category_id") @db.Uuid
  qrCode       String?     @unique @map("qr_code") @db.VarChar(255)
  status       AssetStatus @default(AVAILABLE)
  location     String?     @db.VarChar(150)
  assignedToId String?     @map("assigned_to") @db.Uuid
  purchaseDate DateTime?   @map("purchase_date") @db.Date
  createdAt    DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  category   AssetCategory       @relation(fields: [categoryId], references: [id])
  assignedTo User?               @relation("AssignedTo", fields: [assignedToId], references: [id])
  dnItems    DeliveryNoteItem[]

  @@index([status])
  @@index([categoryId])
  @@map("assets")
}

model DeliveryNote {
  id            String   @id @default(uuid()) @db.Uuid
  dnNumber      String   @unique @map("dn_number") @db.VarChar(30)
  requestId     String   @unique @map("request_id") @db.Uuid
  recipientId   String   @map("recipient_id") @db.Uuid
  createdById   String   @map("created_by") @db.Uuid
  pdfUrl        String?  @map("pdf_url") @db.VarChar(500)
  signatureData String?  @map("signature_data")           // base64 PNG
  signedAt      DateTime? @map("signed_at") @db.Timestamptz
  status        DnStatus @default(DRAFT)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  request   AssetRequest       @relation(fields: [requestId], references: [id])
  recipient User               @relation("Recipient", fields: [recipientId], references: [id])
  creator   User               @relation("Creator", fields: [createdById], references: [id])
  items     DeliveryNoteItem[]

  @@index([status])
  @@map("delivery_notes")
}

model DeliveryNoteItem {
  id             String   @id @default(uuid()) @db.Uuid
  deliveryNoteId String   @map("delivery_note_id") @db.Uuid
  assetId        String   @map("asset_id") @db.Uuid
  notes          String?
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  deliveryNote DeliveryNote @relation(fields: [deliveryNoteId], references: [id], onDelete: Cascade)
  asset        Asset        @relation(fields: [assetId], references: [id])

  @@unique([deliveryNoteId, assetId])
  @@map("delivery_note_items")
}

model PurchaseOrder {
  id          String   @id @default(uuid()) @db.Uuid
  poNumber    String   @unique @map("po_number") @db.VarChar(30)
  requestId   String?  @unique @map("request_id") @db.Uuid
  supplier    String   @db.VarChar(200)
  totalCost   Decimal  @map("total_cost") @db.Decimal(15, 2)
  status      PoStatus @default(DRAFT)
  itemCount   Int      @default(0) @map("item_count")
  expectedAt  DateTime? @map("expected_at") @db.Date
  receivedAt  DateTime? @map("received_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  request AssetRequest? @relation(fields: [requestId], references: [id])

  @@index([status])
  @@map("purchase_orders")
}

model Notification {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  title     String    @db.VarChar(200)
  message   String
  type      NotifType
  isRead    Boolean   @default(false) @map("is_read")
  entityId  String?   @map("entity_id") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  action     String   @db.VarChar(50)
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id") @db.Uuid
  changes    Json?
  ipAddress  String?  @map("ip_address") @db.Inet
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User? @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

> **Catatan desain**: `RequestTimeline` dinormalisasi jadi tabel terpisah (prototype
> menyimpan timeline sebagai array di objek request). Auto-status `Inventory.status`
> dihitung di server action saat `currentStock`/`minStock` berubah (atau via DB
> trigger dari `schema.sql` bila pakai raw migration). Business-rule CHECK constraint
> dari `schema.sql` (chk_reject_reason, chk_assigned_status, chk_dn_signed, dll)
> di-enforce via Zod + logika action; opsional tambahkan lewat migration SQL manual.

---

## 7. Authentication & Authorization

### 7.1 NextAuth v5 — Credentials + JWT
- Provider: **Credentials** (email + password). Verifikasi dengan `bcrypt.compare`.
- Session strategy: **JWT** (wajib untuk Credentials provider).
- JWT callback: sisipkan `id`, `role`, `name`, `division` ke token → session.
- File: `lib/auth.ts` (export `auth`, `handlers`, `signIn`, `signOut`).
- Augmentasi tipe `next-auth` agar `session.user.role: UserRole` typed.

### 7.2 Middleware route guard (`middleware.ts`)
- Redirect ke `/login` jika tidak ada session.
- Matriks akses per prefix route:

| Route prefix              | KARYAWAN | ADMIN_ASET | MANAGER |
|---------------------------|:--------:|:----------:|:-------:|
| `/dashboard`              | ✅ | redirect | redirect |
| `/permintaan`, `/permintaan/baru` | ✅ | ❌ | ❌ |
| `/antrian`, `/inventori`, `/delivery-notes`, `/pengadaan`, `/master-aset` | ❌ | ✅ | ❌ |
| `/approval`, `/riwayat`, `/laporan` | ❌ | ❌ | ✅ |

- Setelah login, redirect ke landing default per role:
  `KARYAWAN→/dashboard`, `ADMIN_ASET→/antrian`, `MANAGER→/approval`.

### 7.3 Server Action guard (`lib/auth-guards.ts`)
- `requireRole(...roles)` — ambil session, lempar error / return 403 jika role tidak cocok.
- Dipanggil di awal SETIAP server action yang melakukan mutasi sensitif. (Defense in depth — jangan hanya andalkan middleware.)

### 7.4 Login page (`app/(auth)/login/page.tsx`)
- Form email + password, styling design system (card di tengah, brand lockup AssetFlow).
- Mock kredensial untuk demo ditampilkan kecil (dari seed): email + "password123".
- **Tidak ada role switcher di produksi** (prototype-only). Role ditentukan dari session.

---

## 8. Modul Fungsional & Acceptance Criteria

Referensi UI detail: README handoff + file `karyawan.jsx` / `admin.jsx` / `manager.jsx`.
Copy bahasa Indonesia harus dipertahankan persis.

### 8.1 KARYAWAN

**Dashboard** (`/dashboard`)
- Greeting time-aware ("Selamat pagi/siang/sore/malam, *Nama*") Fraunces besar + tanggal id-ID long.
- CTA "Ajukan Permintaan Baru" (kanan atas).
- 3 MetricCard: Permintaan Aktif (amber), Aset Saya (navy, "unit"), Permintaan {bulan} (sage).
- 2 kolom: "Aktivitas Terbaru" (5 permintaan terakhir user → klik buka Request Detail modal; empty state) + "Aset Saya" (aset assigned ke user; empty state).
- ✅ AC: data dari DB sesuai user login; angka metric akurat; empty state muncul saat kosong.

**Form Permintaan** (`/permintaan/baru`)
- Card "Informasi Permintaan": justifikasi textarea (wajib >10 char), tanggal dibutuhkan (wajib), urgensi segmented 4-button.
- Card "Item yang Diminta": baris repeatable (Kategori select, Nama Item, Qty number, Catatan, hapus-baris [disabled kalau 1 baris]). "Tambah Baris".
- Action bar sticky: hint validitas ("Siap dikirim" sage saat valid) + Batal / Simpan Draft / Kirim (disabled sampai valid).
- Submit: generate `REQ-YYYY-####`, status `PENDING_APPROVAL`, timeline awal "Permintaan dikirim", buat notifikasi `NEW_REQUEST` untuk Manager terkait, redirect ke `/permintaan`, toast sukses.
- ✅ AC: validasi Zod jalan; nomor REQ unik; notifikasi manager terbuat; data persist di DB.

**Permintaan Saya** (`/permintaan`)
- Filter: search (id/nama item), status select, urgensi select.
- Tabel: Nomor (mono) · Tanggal · Item (item pertama + "+N lainnya") · Urgensi badge · Status badge · chevron. Klik baris → Request Detail modal. Empty state.
- ✅ AC: filter berfungsi server-side atau client-side; hanya permintaan milik user.

### 8.2 ADMIN ASET

**Antrian Proses** (`/antrian`)
- 3 Tabs + count: Perlu Diproses (`APPROVED`) · Sedang Diproses (`PROCESSING`) · Menunggu TTD (`READY_TO_SIGN`).
- Grid 2 kolom kartu request: avatar+id+urgensi, nama/divisi/butuh, daftar item, tombol aksi per-tab (Cek Stok/Buat DN; Konfirmasi Stok/Kirim untuk TTD; Buka TTD Digital → Signature modal). Empty state per tab.
- Aksi memindahkan status: APPROVED→PROCESSING→READY_TO_SIGN→(TTD)→COMPLETED. Buat DN saat "Buat DN".
- ✅ AC: transisi status benar + timeline + notifikasi; pembuatan DN menautkan request.

**Inventori** (`/inventori`)
- 3 MetricCard: Total SKU, Stok Rendah (low+empty), Nilai Inventori (`rpShort`).
- Filter: search + kategori. Tabel: Kategori · Item · Stok (mono) · Min · Harga (`rp`) · Status badge · menu. Baris tinted: EMPTY=rust-sf/40, LOW=amber-sf/30.
- Status: stock 0→EMPTY, stock<min→LOW, else OK (hitung di action saat update).
- Aksi "Tambah Stok" + "Kelola Kategori".
- ✅ AC: auto-status akurat; nilai inventori = Σ(stock×price).

**Delivery Notes** (`/delivery-notes`)
- 2 kolom `[1fr 2fr]`: kiri list DN (id, status, recipient, divisi/tanggal; selected=amber-sf + border kiri amber); kanan **preview dokumen DN printable** (kop perusahaan, grid ref, tabel item + total, 2 blok TTD: "Diserahkan oleh" Siti Rahayu / "Diterima oleh" recipient).
- Status `SIGNED` → blok recipient tampilkan nama Fraunces italic sbg "tanda tangan"; `READY_TO_SIGN` → tombol "TTD Digital" buka Signature modal. Empty state sampai DN dipilih.
- ✅ AC: preview render data DN nyata; sign menyimpan `signatureData`+`signedAt`+status SIGNED.

**Pengadaan** (`/pengadaan`)
- "PO Baru" → modal (supplier select, expected date, callout low-stock items, note ke manager, Kirim ke Manager).
- Tabel: Nomor PO · Supplier · Tanggal · ETA · Items · Total (`rp`) · Status badge.
- ✅ AC: generate `PO-YYYY-####`; status workflow DRAFT→APPROVED→IN_PROGRESS→RECEIVED; markReceived set `receivedAt`.

**Master Aset** (`/master-aset`)
- Aksi: Scan QR (QR modal) + Daftarkan Aset. Filter: search (code/name) + status.
- Tabel: QR glyph (SVG kecil) · Kode Aset (mono) · Nama/Kategori · Pengguna · Lokasi · Status badge · menu.
- ✅ AC: register generate `AST-YYYY-#####` + qrCode unik; transfer ubah `assignedToId`+status; setMaintenance ubah status.

### 8.3 MANAGER

**Antrian Approval** (`/approval`)
- List kartu lebar request `PENDING_APPROVAL`: avatar besar, id+urgensi+butuh, nama (serif)+divisi, justifikasi 2 baris, chips item, "Lihat detail lengkap →" (Request Detail mode approval), tombol Setujui (sage) / Tolak (danger).
- Approve → status APPROVED + timeline + notifikasi `APPROVED` ke requester + toast.
- Reject → buka Reject modal (alasan wajib ≥10 char) → status REJECTED + simpan reason + notifikasi `REJECTED` + toast.
- ✅ AC: hanya manager; aksi atomik + audit log; requester dapat notifikasi.

**Riwayat Approval** (`/riwayat`)
- Filter chips: Semua / Disetujui / Ditolak. Tabel keputusan: tanggal · id · requester · item · keputusan badge. Baris rejected → baris tambahan tint rust berisi alasan.
- ✅ AC: hanya keputusan yang sudah diputus tampil; alasan reject tampil.

**Laporan & Analytics** (`/laporan`)
- 4 MetricCard + trend: Permintaan Bulan Ini, Approval Rate %, Avg Processing Time (hari), Total Pengadaan (`rpShort`).
- Bar chart "Volume Permintaan Bulanan" + toggle 6B/12B (approved=sage, rejected=rust).
- 2 kolom: Donut "Distribusi per Kategori" + legend; Line "Trend Approval Rate".
- Tabel "Top Pemohon": rank, nama, divisi, count, approval-rate progress bar, total value.
- Tombol Export Excel / Export PDF (boleh stub/placeholder dulu).
- ✅ AC: metric dihitung dari data DB nyata (agregasi); chart render; angka konsisten.

---

## 9. Server Actions Catalog

Semua di folder `actions/`. Tiap action: `"use server"`, panggil `requireRole()`,
validasi Zod, mutasi Prisma, tulis `AuditLog` bila relevan, `revalidatePath`.

| Action | Role | Efek |
|--------|------|------|
| `submitRequest(data)` | KARYAWAN | Buat AssetRequest + items + timeline + notif manager |
| `approveRequest(id)` | MANAGER | status→APPROVED, timeline, notif requester, audit |
| `rejectRequest(id, reason)` | MANAGER | status→REJECTED, simpan reason, notif, audit |
| `startProcessing(id)` | ADMIN_ASET | status→PROCESSING, timeline |
| `createDeliveryNote(reqId, assetIds)` | ADMIN_ASET | Buat DN + dnItems, status→READY_TO_SIGN |
| `signDeliveryNote(dnId, signatureBase64)` | ADMIN_ASET/KARYAWAN | simpan signature, status→SIGNED, request→COMPLETED, notif |
| `adjustStock(invId, delta)` | ADMIN_ASET | update stock + recompute status |
| `createCategory(data)` | ADMIN_ASET | buat AssetCategory |
| `registerAsset(data)` | ADMIN_ASET | buat Asset + assetCode + qrCode |
| `transferAsset(assetId, userId)` | ADMIN_ASET | set assignedToId, status→IN_USE |
| `setAssetMaintenance(assetId)` | ADMIN_ASET | status→MAINTENANCE |
| `createPurchaseOrder(data)` | ADMIN_ASET | buat PO + poNumber |
| `markPOReceived(poId)` | ADMIN_ASET | status→RECEIVED, receivedAt |
| `markAllNotificationsRead()` | semua | set isRead=true utk user |

---

## 10. Validasi & Business Rules

Zod schema di `lib/validations/`. Selaras dengan CHECK constraints `schema.sql`:
- **Request**: `reason` min 10 char; `neededDate` wajib; tiap item `quantity > 0` + ada kategori/nama.
- **Reject**: `reason` min 10 char (kalau status REJECTED wajib ada — cermin `chk_reject_reason`).
- **Asset IN_USE** wajib `assignedToId` (cermin `chk_assigned_status`).
- **DN SIGNED/ARCHIVED** wajib `signatureData` + `signedAt` (cermin `chk_dn_signed`).
- **PO RECEIVED** wajib `receivedAt` (cermin `chk_po_received`).
- **Inventory**: `currentStock >= 0`, `minStock >= 0`; status diturunkan otomatis.

---

## 11. Non-Functional Requirements
- **Security**: password bcrypt (rounds 10); semua mutasi lewat `requireRole`; tidak ada secret di client; CSRF ditangani Server Actions Next.js.
- **Performance**: query pakai `select`/`include` seperlunya; index DB sesuai schema; pagination tabel kalau data > 50 baris (opsional fase polish).
- **Aksesibilitas**: kontras warna sudah aman (design system); label form pakai `<label>`; focus ring jelas.
- **Responsif**: sidebar off-canvas < md; search hidden < md; grid → 1 kolom; modal → bottom sheet < md.
- **Audit**: tulis AuditLog untuk approve/reject/sign/transfer/register/PO-received.
- **Error handling**: server action return `{ ok, error? }`; tampilkan toast error; jangan bocorkan stack ke user.

---

## 12. Seed Data (`prisma/seed.ts`)

Port dari `data.jsx` (sudah berisi konteks Indonesia). Hash semua password jadi
`password123` (bcrypt). Buat berurutan agar FK valid:

1. **Users (5)** — Budi Aryanto (KARYAWAN/IT Support), Sari Wulandari (KARYAWAN/Marketing), Siti Rahayu (ADMIN_ASET/General Affairs), Bambang Sudirman (MANAGER/IT Support), Diana Putri (MANAGER/Marketing). Email pola `nama@handal.co.id`. Warna avatar dari data.jsx.
2. **Categories (6)** — Laptop, Monitor, Mouse, Keyboard, Kabel HDMI, Headset.
3. **Inventory (12)** — dari `INVENTORY` (stock/min/unit/price). Hitung status awal.
4. **Assets (12)** — dari `ASSETS` (code/name/category/status/assignedTo/location/since). Generate qrCode = assetCode.
5. **Requests (8)** — dari `REQUESTS` lengkap dengan items + timeline + rejectReason. Map `requester`/`approver` ke user id.
6. **Delivery Notes (5)** + **Purchase Orders (4)** — dari `DELIVERY_NOTES`/`PURCHASE_ORDERS`.
7. **Notifications (5)** — dari `NOTIFICATIONS`, assign ke user yang relevan.

> Data laporan (`MONTHLY_REQUESTS`, `CATEGORY_DISTRIBUTION`) boleh dihitung dari data
> nyata via agregasi, atau di-seed sbg tabel ringkasan kalau mau cepat. Untuk fase awal,
> hitung agregasi on-the-fly di halaman Laporan.

---

## 13. Implementation Phases (URUTAN EKSEKUSI)

> Kerjakan berurutan. Tiap fase punya exit criteria — jangan lanjut sebelum hijau.

**Fase 0 — Scaffold**
`create-next-app` (TS, App Router, Tailwind, ESLint). Install deps: `prisma @prisma/client next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers lucide-react`. Setup `tailwind.config.ts` (§5.1) + fonts (§5.2) + `globals.css` (§5.3).
✅ Exit: `npm run dev` jalan, font & warna token kepakai.

**Fase 1 — Database**
Buat project Supabase, ambil connection string (pooled + direct). Isi `.env.local`. Tulis `schema.prisma` (§6). `prisma generate` + `prisma db push`. Tulis & jalankan `seed.ts` (§12).
✅ Exit: 11 tabel + enum ada di Supabase; seed sukses; bisa query via Prisma Studio.

**Fase 2 — Design System**
Port `ui.jsx` → `components/ui/*.tsx` (typed). Port `lib/status.ts` (§5.6) + `lib/format.ts` (§5.7). Ganti `window.Icon` → `lucide-react` langsung.
✅ Exit: semua primitive render benar di halaman dummy /styleguide (boleh sementara).

**Fase 3 — Auth**
`lib/prisma.ts`, `lib/auth.ts` (Credentials+JWT+role), `app/api/auth/[...nextauth]/route.ts`, augment tipe, `middleware.ts` (§7.2), `lib/auth-guards.ts`, halaman `/login`.
✅ Exit: login 3 user berbeda → redirect ke landing role masing-masing; route guard menolak akses lintas-role.

**Fase 4 — App Shell**
`app/(app)/layout.tsx` + `components/layout/` (Sidebar, Topbar, Toast). Sidebar nav per role (§ NAV), active state amber. Topbar: search, notif bell + dropdown, **user menu (logout) — bukan role switcher**.
✅ Exit: shell tampil untuk user login; navigasi antar halaman jalan; logout berfungsi.

**Fase 5 — Modul Karyawan**
Dashboard, Form Permintaan, Permintaan Saya + action `submitRequest`. Modal Request Detail (mode view).
✅ Exit: submit permintaan → muncul di list & antrian manager; metric dashboard akurat.

**Fase 6 — Modul Manager**
Antrian Approval, Riwayat, Laporan (charts port `charts.jsx`). Action `approveRequest`/`rejectRequest`. Modal Reject + Request Detail (mode approval).
✅ Exit: approve/reject ubah status + notif requester; chart laporan render dari data nyata.

**Fase 7 — Modul Admin**
Antrian Proses, Inventori, Delivery Notes (+ preview printable), Pengadaan, Master Aset. Actions: processing, createDeliveryNote, adjustStock, registerAsset, transferAsset, createPurchaseOrder, markPOReceived.
✅ Exit: alur APPROVED→PROCESSING→DN→READY_TO_SIGN jalan; inventori auto-status; master aset CRUD.

**Fase 8 — Modals interaktif**
Signature modal (canvas → base64, action `signDeliveryNote`), QR Scanner modal (mock + lookup aset), Notification dropdown (markAllRead).
✅ Exit: TTD digital menyimpan signature + set DN SIGNED + request COMPLETED + notif; QR lookup tampil detail aset.

**Fase 9 — Notifikasi & Audit**
Pasang pembuatan Notification di tiap action relevan + AuditLog. Bell count realtime via revalidation.
✅ Exit: aksi memunculkan notifikasi ke user yang tepat; audit log terisi.

**Fase 10 — Polish & QA**
Responsif (mobile sidebar/bottom-sheet), empty states, loading states, error toasts, validasi edge case. Jalankan §14 checklist.
✅ Exit: semua acceptance criteria §8 hijau; mobile rapi.

---

## 14. Acceptance Testing Checklist

**Auth & Guard**
- [ ] Login salah → error; benar → redirect landing role.
- [ ] Karyawan akses `/laporan` → ditolak/redirect. Manager akses `/inventori` → ditolak.
- [ ] Logout → balik ke `/login`.

**Alur end-to-end (happy path)**
- [ ] Karyawan submit permintaan → muncul di Antrian Approval Manager.
- [ ] Manager approve → muncul di Antrian Proses Admin (tab Perlu Diproses).
- [ ] Admin proses → buat DN → status Menunggu TTD.
- [ ] TTD digital → DN SIGNED + request COMPLETED + notif ke requester.
- [ ] Riwayat Approval mencatat keputusan; dashboard karyawan metric update.

**Alur reject**
- [ ] Manager reject tanpa alasan → tombol disabled. Dengan alasan ≥10 char → REJECTED + notif + alasan tampil di riwayat.

**Inventori & Aset**
- [ ] Set stock 0 → badge Habis; stock < min → Stok Rendah; else OK.
- [ ] Register aset → kode AST unik + qrCode. Transfer → IN_USE + assignedTo. QR scan → detail benar.

**UI fidelity**
- [ ] Warna/badge persis §5.6. Fraunces di heading, Mono di ID/angka.
- [ ] Hover-lift di card; modal bottom-sheet di mobile; sidebar off-canvas < md.

---

## 15. Environment Variables (`.env.example`)

```bash
# Supabase PostgreSQL — ambil dari Project Settings → Database
# Pooled connection (pgbouncer) untuk runtime
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection untuk prisma migrate / db push
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# NextAuth
AUTH_SECRET="generate dengan: npx auth secret"
AUTH_URL="http://localhost:3000"
```

> Catatan: pakai `DATABASE_URL` (pooled, :6543) untuk Prisma Client runtime, dan
> `DIRECT_URL` (:5432) untuk `prisma db push`/`migrate`. Tambahkan `?pgbouncer=true`
> pada pooled URL agar Prisma tidak prepared-statement-cache.

---

## 16. Appendix — Artefak Pendukung (sudah ada)

Diagram & dokumen yang sudah dibuat sebelumnya, bisa dirujuk di laporan KP:
- `activity-diagram-usulan.drawio` — alur proses usulan.
- `sequence-diagram-usulan.drawio` — interaksi antar komponen (4 fase, 42 message).
- `class-diagram-usulan.drawio` — 10 class + relasi.
- `erd-database-postgresql.drawio` — ERD 11 tabel + crow's foot.
- `schema.sql` — DDL PostgreSQL mentah (alternatif Prisma `db push`; berisi trigger & CHECK constraint yang bisa ditambahkan via migration).
- Prototype UI (`reference/`) — sumber kebenaran visual (HIGH fidelity).

> **Jika ingin menambahkan trigger & CHECK constraint asli dari `schema.sql`** (auto
> updated_at, auto stock status, semua CHECK), jalankan sebagai SQL migration manual
> setelah `prisma db push`, atau konversi `schema.prisma` ke `prisma migrate` lalu
> tempel SQL tambahan ke file migration.

---

## 17. Instruksi untuk Claude Code

1. Baca SELURUH PLAN.md ini sebelum menulis kode.
2. Eksekusi **berurutan** Fase 0 → 10. Setelah tiap fase, verifikasi exit criteria.
3. Pertahankan **copy bahasa Indonesia** persis dari prototype.
4. Rekreasi UI **HIGH fidelity** sesuai §5 dan file `reference/` — jangan menyederhanakan styling.
5. Jangan pakai Supabase Auth/RLS/Storage/Realtime (lihat §2 Non-Goals).
6. Untuk hal yang ambigu, default ke perilaku prototype (`main.jsx` + README).
7. Commit per fase dengan pesan Conventional Commits (feat/fix/chore) tanpa scope.
```
