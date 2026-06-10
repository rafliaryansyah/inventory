# AssetFlow

Sistem Informasi Manajemen Aset internal **PT Handal Informasi Teknologi**.
Mendigitalkan siklus permintaan & manajemen aset: permintaan → approval →
proses → Delivery Note + tanda tangan digital → master aset (QR).

Dibangun sesuai [`PLAN.md`](./PLAN.md). Satu aplikasi, tiga peran (Karyawan /
Admin Aset / Manager) — navigasi & landing page menyesuaikan peran.

## Tech Stack

| Layer | Pilihan |
|-------|---------|
| Framework | Next.js 15 (App Router, RSC + Server Actions) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v3 (design token editorial — Fraunces + Plus Jakarta + JetBrains Mono) |
| Database | **Neon PostgreSQL** |
| ORM | Prisma 5 (`db push` + `seed`) |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| Validasi | Zod + React Hook Form |
| File storage | **Cloudflare R2** (S3-compatible) — opsional |
| Deploy | **Railway** |

## Prasyarat

- Node.js ≥ 18.18
- Database Neon PostgreSQL (connection string)

## Setup Lokal

```bash
# 1. Install dependencies
npm install

# 2. Konfigurasi environment — salin .env.example → .env, isi nilainya
cp .env.example .env
#   - DATABASE_URL : connection string Neon
#   - AUTH_SECRET  : npx auth secret   (atau: openssl rand -base64 33)
#   - AUTH_URL     : http://localhost:3000

# 3. Push schema ke database + generate client
npm run db:push

# 4. Seed data demo (5 user, 12 inventori, 12 aset, 8 permintaan, dst.)
npm run db:seed

# 5. Jalankan
npm run dev          # http://localhost:3000
```

### Kredensial Demo (password semua: `password123`)

| Peran | Email | Landing |
|-------|-------|---------|
| Karyawan | `budi@handal.co.id` / `sari@handal.co.id` | `/dashboard` |
| Admin Aset | `siti@handal.co.id` | `/antrian` |
| Manager | `bambang@handal.co.id` / `diana@handal.co.id` | `/approval` |

## Scripts

| Script | Aksi |
|--------|------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Jalankan build produksi |
| `npm run db:push` | Sinkron schema Prisma → database |
| `npm run db:seed` | Isi data demo |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset DB + seed ulang |

## Deploy ke Railway

1. Buat service baru dari repo ini di Railway.
2. Set environment variables di Railway:
   - `DATABASE_URL` — connection string Neon.
   - `AUTH_SECRET` — hasil `npx auth secret`.
   - `AUTH_URL` — URL publik Railway, mis. `https://assetflow.up.railway.app`.
   - (opsional) variabel R2 di bawah.
3. **Build command**: `npm run build` (otomatis `prisma generate`).
   **Start command**: `npm run start`.
4. Sinkronkan schema ke database sekali (pre-deploy / lokal):
   `npm run db:push` lalu `npm run db:seed` jika butuh data awal.

> `postinstall` sudah menjalankan `prisma generate`, jadi Prisma Client siap
> di lingkungan Railway.

## Cloudflare R2 (penyimpanan file — opsional)

Upload resource & PDF Delivery Note menggunakan R2 (S3-compatible). Jika
variabel R2 kosong, aplikasi tetap berjalan — fitur upload nonaktif dengan
pesan yang jelas (degrade gracefully).

```bash
R2_ACCOUNT_ID=""          # Account ID Cloudflare
R2_ACCESS_KEY_ID=""       # R2 API token — Access Key ID
R2_SECRET_ACCESS_KEY=""   # R2 API token — Secret Access Key
R2_BUCKET="assetflow"     # Nama bucket
R2_PUBLIC_URL=""          # URL publik bucket (R2.dev / custom domain), tanpa trailing slash
```

Endpoint dibentuk otomatis: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
Bila `R2_PUBLIC_URL` kosong, helper memakai presigned URL (berlaku 1 jam).

## Struktur

```
app/
  (auth)/login/         # Halaman login
  (app)/                # Grup terproteksi (middleware guard)
    dashboard permintaan antrian inventori delivery-notes
    pengadaan master-aset approval riwayat laporan
  api/auth/[...nextauth] # Handler NextAuth
actions/                # Server Actions (mutasi)
components/  ui/  layout/  charts/  modals/  features/
lib/         prisma auth status format codegen storage dn-pdf
             queries/  validations/
prisma/      schema.prisma  seed.ts
middleware.ts            # Route guard per peran
```

## Catatan Arsitektur

- **Read**: Server Component memanggil fungsi di `lib/queries/*` (Prisma) langsung.
- **Write**: Client Component memanggil Server Action → mutasi → `revalidatePath`.
- **Auth**: `middleware.ts` (edge-safe) cek session + matriks peran; setiap server
  action memanggil `requireRole()` sebagai guard lapis kedua.
- **Audit & Notifikasi** ditulis di dalam transaksi action yang relevan.
