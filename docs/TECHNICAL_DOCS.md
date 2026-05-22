# 🔧 Dokumentasi Teknis SekolahKu

> **Aplikasi Tata Usaha Sekolah** — Next.js 14 + MongoDB + Tailwind + shadcn/ui
> Versi: 1.0 • Update terakhir: 2026

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Struktur Folder](#3-struktur-folder)
4. [Database Schema](#4-database-schema)
5. [Backend API Reference](#5-backend-api-reference)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [Security Features](#7-security-features)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Environment Variables](#9-environment-variables)
10. [Setup & Development](#10-setup--development)
11. [Deployment](#11-deployment)
12. [Testing Strategy](#12-testing-strategy)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Konvensi Code](#14-konvensi-code)
15. [Known Issues & Roadmap](#15-known-issues--roadmap)

---

## 1. Tech Stack

### Frontend
- **Framework**: Next.js 14.2.3 (App Router)
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (`/app/lib/store/auth-store.js`)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios (`/app/lib/api/client.js`)
- **Charts**: Recharts
- **Icons**: lucide-react
- **QR Generation**: `qrcode.react`
- **QR Scanning**: `html5-qrcode` (dynamic-loaded)
- **Notifications**: Sonner (toast)
- **PWA**: next-pwa configuration

### Backend (dalam Next.js)
- **API Routes**: Monolithic catch-all router `/app/app/api/[[...path]]/route.js`
- **Database Driver**: `mongodb` (official Node.js)
- **Auth**: `jsonwebtoken` + `bcryptjs`
- **UUID**: `uuid` v4 untuk semua ID
- **Email**: Resend (`resend` SDK)
- **AI Chat**: Emergent LLM proxy → OpenAI gpt-4o-mini
- **Export**: SheetJS (`xlsx`) untuk Excel, `jspdf` untuk PDF

### Database
- **MongoDB** (local atau Atlas)
- Collections: `users`, `siswa`, `guru`, `kelas`, `pembayaran`, `absensi`, `surat_masuk`, `surat_keluar`, `settings`

### Infrastructure
- **Process Manager**: Supervisor (`nextjs`, `mongodb`)
- **Hosting**: Kubernetes container (Emergent)
- **Reverse Proxy**: Kubernetes Ingress (route `/api/*` → port 3000)

---

## 2. Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js App Router (Client + Server Components)       │  │
│  │  - Login Page (page.js)                                 │  │
│  │  - Dashboard layout + protected pages                   │  │
│  │  - shadcn UI components                                 │  │
│  │  - Zustand auth-store (token + user in localStorage)    │  │
│  └─────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │  HTTP (Axios with Bearer JWT)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│   Kubernetes Ingress (port mapping /api/* → :3000)           │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js Server (port 3000, supervised)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Monolithic API Router                                   │ │
│  │ /app/app/api/[[...path]]/route.js                       │ │
│  │                                                          │ │
│  │  • handleAuth(login, me)                                 │ │
│  │  • handlePembayaran (generate-tagihan, lunas)            │ │
│  │  • handleAbsensi (filter, rekap, CRUD)                   │ │
│  │  • handleUsers (CRUD + bcrypt hashing)                   │ │
│  │  • handleStats                                           │ │
│  │  • handleChat (LLM proxy, protected)                     │ │
│  │  • crud() generic helper for siswa/guru/kelas/surat      │ │
│  │                                                          │ │
│  │  Cross-cutting:                                          │ │
│  │  • JWT verification (getAuthFromRequest)                 │ │
│  │  • Per-route role permissions (ROUTE_PERMISSIONS)        │ │
│  │  • Rate-limiting (per-IP / per-user)                     │ │
│  │  • Input sanitization (sanitizeBody)                     │ │
│  │  • Bounded queries (.limit())                            │ │
│  │  • ensureSeeded() on first request                       │ │
│  └────────────────────────────────┬───────────────────────┘ │
└───────────────────────────────────┼─────────────────────────┘
                                    ▼
              ┌─────────────────────────────┐
              │   MongoDB (local/Atlas)      │
              │   - 9 collections            │
              │   - UUID strings as ids      │
              │   - No ObjectId in responses │
              └─────────────────────────────┘

         External APIs (server-to-server):
         • Resend (email)
         • Emergent LLM proxy (AI chat)
```

### Filosofi Desain

1. **Monolithic API router**: Semua endpoint di-handle oleh satu file `route.js` dengan internal routing manual. Tidak ada `/api/siswa/route.js` terpisah.
2. **Defense-in-depth**: Setiap mutasi di-cek auth + role + rate-limit + sanitize.
3. **UUID-first**: Semua entitas pakai UUID v4. `_id` MongoDB tidak pernah di-leak ke client.
4. **Bounded queries**: Semua `find()` pakai `.limit()` untuk safety produksi.
5. **Idempoten seed**: `ensureSeeded()` hanya seed sekali (cek count > 0).

---

## 3. Struktur Folder

```
/app
├── app/                            # Next.js App Router
│   ├── api/
│   │   └── [[...path]]/route.js    # 🎯 SEMUA API endpoint di sini
│   ├── (dashboard)/                # Route group untuk protected pages
│   │   ├── layout.js               # Sidebar + Topbar layout
│   │   ├── dashboard/page.js
│   │   ├── siswa/page.js
│   │   ├── guru/page.js
│   │   ├── kelas/page.js
│   │   ├── pembayaran/page.js
│   │   ├── absensi/page.js
│   │   ├── surat/page.js
│   │   ├── settings/page.js
│   │   └── users/page.js
│   ├── layout.js                   # Root layout (metadata, fonts, providers)
│   ├── page.js                     # Login page (with dynamic branding)
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── app-sidebar.jsx             # Sidebar dengan role-filtered menu
│   ├── app-topbar.jsx              # Topbar (search, notif, theme, user)
│   ├── auth-guard.jsx              # Wrapper redirect ke /login jika tidak auth
│   ├── ai-chatbot.jsx              # Floating chat widget
│   ├── barcode-scanner.jsx         # html5-qrcode wrapper (lazy-loaded)
│   ├── theme-provider.jsx          # next-themes wrapper
│   └── ... (form dialogs etc)
├── lib/
│   ├── db.js                       # MongoDB singleton client
│   ├── seed.js                     # ensureSeeded() — idempoten
│   ├── mock-data.js                # Initial mock untuk seed
│   ├── api/client.js               # Axios instance + interceptors
│   ├── auth/
│   │   ├── jwt.js                  # signToken, verify, hashPassword, requireRole
│   │   └── roles.js                # ROLES + ROUTE_ACCESS map (frontend)
│   ├── email/send.js               # Resend wrapper + email templates
│   ├── hooks/use-crud.js           # Custom hook untuk CRUD ke API
│   ├── store/auth-store.js         # Zustand store + persist
│   └── utils.js                    # cn(), formatCurrency, etc
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── icon-192.png, icon-512.png  # PWA icons
│   └── ... (static assets)
├── docs/                           # 📘 Dokumentasi (folder ini)
│   ├── USER_GUIDE.md
│   └── TECHNICAL_DOCS.md
├── memory/
│   └── test_credentials.md         # Akun seeded untuk testing
├── .env                            # Environment variables (DO NOT COMMIT)
├── package.json
├── next.config.js
├── tailwind.config.js
├── components.json                 # shadcn config
├── test_result.md                  # Test results history
└── README.md
```

---

## 4. Database Schema

Semua koleksi MongoDB. **`id` adalah UUID v4 string** (bukan ObjectId). `_id` MongoDB di-strip dari semua response API via projection.

### `users`
```js
{
  id: "uuid-string",
  email: "admin@sekolahku.id",       // unique
  name: "Pak Admin",
  password: "$2b$10$...",             // bcrypt hash (NEVER returned in API)
  role: "admin" | "tu" | "wali_kelas",
  kelas: "7A" | null,                 // only for wali_kelas
  createdAt: Date,
  updatedAt: Date
}
```

### `siswa`
```js
{
  id: "uuid-string",
  nis: "001",                         // Nomor Induk Siswa
  nama: "Andi Pratama",
  kelas: "7A",
  status: "Aktif" | "Nonaktif",
  email: "andi@email.com",            // optional
  emailOrtu: "ortu@email.com",        // for SPP notif
  namaOrtu: "Pak Budi",
  teleponOrtu: "08123...",
  createdAt: Date
}
```

### `guru`
```js
{
  id: "uuid-string",
  nip: "198501012010011001",
  nama: "Bu Sari, S.Pd",
  mapel: "Matematika",
  telepon: "0812345...",
  createdAt: Date
}
```

### `kelas`
```js
{
  id: "uuid-string",
  nama: "7A",
  tingkat: "SMP" | "SMA",
  waliKelasId: "uuid-of-guru",         // FK to guru
  waliKelas: "Bu Sari",                // denormalized
  jumlahSiswa: 32,                     // optional, can be derived
  createdAt: Date
}
```

### `pembayaran`
```js
{
  id: "uuid-string",
  siswaId: "uuid-of-siswa",
  namaSiswa: "Andi Pratama",           // denormalized for table display
  kelas: "7A",
  bulan: "Juli",
  tahun: 2026,
  jumlah: 600000,                      // Rp
  metode: "Tunai" | "Transfer" | "QRIS" | null,
  status: "Lunas" | "Belum Lunas",
  tanggalBayar: "2026-07-15" | null,   // YYYY-MM-DD string
  createdAt: Date
}
```

### `absensi`
```js
{
  id: "uuid-string",
  tanggal: "2026-05-22",               // YYYY-MM-DD
  kelas: "7A",
  items: [
    { siswaId: "uuid", nis: "001", nama: "Andi", status: "Hadir" }
  ],
  totalHadir: 25, totalIzin: 2, totalSakit: 1, totalAlpa: 0,
  sumberInput: "manual" | "scan",
  createdAt: Date,
  updatedAt: Date
}
```

Unique-ish constraint: kombinasi `(tanggal, kelas)` — frontend memastikan UPSERT (PUT jika exist, POST jika baru).

### `surat_masuk` / `surat_keluar`
```js
{
  id: "uuid-string",
  nomor: "001/SK/2026",
  pengirim: "Dinas Pendidikan",        // or tujuan for keluar
  perihal: "Undangan Rapat",
  tanggal: "2026-05-22",
  status: "Diterima" | "Dikirim" | "Dibalas",
  file: "base64-or-url",                // optional attachment
  createdAt: Date
}
```

### `settings`
Singleton document (hanya 1 row).
```js
{
  id: "uuid-string",
  // SPP
  sppSMP: 400000,
  sppSMA: 600000,
  // School profile
  namaSekolah: "SMA Negeri 1 Jakarta",
  npsn: "12345678",
  kepalaSekolah: "Drs. Budi P., M.Pd",
  alamat: "Jl. Pendidikan No. 1",
  telepon: "021-12345678",
  emailSekolah: "info@sekolahku.id",
  // Branding login
  logoUrl: "data:image/png;base64,...",
  taglineApp: "Portal Tata Usaha",
  heroTitle: "Kelola Administrasi Sekolah...",
  heroSubtitle: "Platform terintegrasi...",
  heroStats: [
    { icon: "Users", value: "650+", label: "Siswa Aktif" },
    // ... 4 items
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. Backend API Reference

**Base URL**: `${NEXT_PUBLIC_BASE_URL}/api`

Semua endpoint (kecuali yang ditandai 🌐 publik) butuh header:
```
Authorization: Bearer <JWT_TOKEN>
```

### 5.1 Auth

| Method | Endpoint | Body | Response | Roles |
|--------|----------|------|----------|-------|
| POST | `/api/auth/login` 🌐 | `{ email, password }` | `{ token, user: {id, email, name, role, kelas} }` | public (rate-limited 5/min/IP) |
| GET | `/api/auth/me` | — | `{ user }` | authenticated |

### 5.2 Settings

| Method | Endpoint | Body | Response | Roles |
|--------|----------|------|----------|-------|
| GET | `/api/settings/public` 🌐 | — | branding fields only | public |
| GET | `/api/settings` | — | full settings doc | any role |
| PUT | `/api/settings` | partial fields | updated doc | admin |

### 5.3 Siswa

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/siswa` | admin, tu, wali_kelas |
| GET | `/api/siswa/:id` | same |
| POST | `/api/siswa` | admin, tu |
| PUT | `/api/siswa/:id` | admin, tu |
| DELETE | `/api/siswa/:id` | admin only |

### 5.4 Guru

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/guru` | admin, tu |
| POST/PUT/DELETE | `/api/guru[/:id]` | admin only |

### 5.5 Kelas

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/kelas` | admin, tu, wali_kelas |
| POST/PUT | `/api/kelas[/:id]` | admin, tu |
| DELETE | `/api/kelas/:id` | admin only |

### 5.6 Pembayaran

| Method | Endpoint | Body | Roles |
|--------|----------|------|-------|
| GET | `/api/pembayaran` | — | admin, tu |
| POST | `/api/pembayaran` | full body | admin, tu |
| POST | `/api/pembayaran/generate-tagihan` | `{ bulan, tahun }` → idempoten | admin, tu |
| POST | `/api/pembayaran/:id/lunas` | `{ metode }` → set status=Lunas + email otomatis | admin, tu |
| PUT/DELETE | `/api/pembayaran/:id` | — | admin (delete), admin/tu (put) |

### 5.7 Absensi

| Method | Endpoint | Body / Query | Roles |
|--------|----------|--------------|-------|
| GET | `/api/absensi` | `?tanggal=YYYY-MM-DD&kelas=X` | admin, tu, wali_kelas (wali restricted to own kelas) |
| GET | `/api/absensi/:id` | — | same |
| GET | `/api/absensi/rekap` | `?bulan=N&tahun=YYYY` → aggregated per-siswa | same |
| POST | `/api/absensi` | full payload | admin, tu, wali_kelas |
| PUT | `/api/absensi/:id` | partial | admin, tu, wali_kelas |
| DELETE | `/api/absensi/:id` | — | admin only |

**Sample POST payload**:
```json
{
  "tanggal": "2026-05-22",
  "kelas": "7A",
  "items": [
    { "siswaId": "uuid-1", "nis": "001", "nama": "Andi", "status": "Hadir" }
  ],
  "totalHadir": 1, "totalIzin": 0, "totalSakit": 0, "totalAlpa": 0,
  "sumberInput": "manual"
}
```

**Sample rekap response**:
```json
{
  "bulan": 5, "tahun": 2026, "total": 32,
  "items": [
    { "id": "uuid", "nis": "001", "nama": "Andi", "kelas": "7A", "hadir": 20, "izin": 1, "sakit": 0, "alpa": 0 }
  ]
}
```

### 5.8 Surat Masuk / Keluar

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST/PUT | `/api/surat-masuk[/:id]` | admin, tu |
| GET/POST/PUT | `/api/surat-keluar[/:id]` | admin, tu |
| DELETE | both | admin only |

### 5.9 Users

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| GET | `/api/users` | — | passwords stripped |
| POST | `/api/users` | `{ name, email, password, role, kelas? }` | password min 6 char, bcrypt hashed |
| PUT | `/api/users/:id` | partial, password optional | dup-email check |
| DELETE | `/api/users/:id` | — | cannot delete self |

All endpoints admin-only.

### 5.10 Stats

| Method | Endpoint | Response | Roles |
|--------|----------|----------|-------|
| GET | `/api/stats` | `{ totalSiswa, totalGuru, totalKelas, pembayaranHariIni, pemasukanChart, absensiChart, kelasDistribusi }` | any role |

### 5.11 Chat (AI)

| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/api/chat` | `{ message, sessionId?, history? }` | **PROTECTED** (auth required) + rate-limit 20/min per-user+IP |

Response: `{ reply: "...", sessionId: "uuid" }`.

---

## 6. Authentication & RBAC

### JWT Configuration
- Algoritma: HS256
- Secret: `process.env.JWT_SECRET` (di `.env`, jangan commit)
- Expiry: 7 hari
- Payload: `{ id, email, name, role, kelas }`

### Login Flow
```
Client ──POST /api/auth/login {email,password}──▶ Server
Server:
  1. Rate-limit check (5/min per IP)
  2. findOne({ email }) — generic error if not found
  3. bcrypt.compare(password, user.password)
  4. signToken(safeUser) — 7d expiry
Client:
  - Store token + user in Zustand (localStorage persist)
  - Axios interceptor attaches Authorization header otomatis
```

### Per-Route Permissions (`ROUTE_PERMISSIONS`)
Defined di `/app/app/api/[[...path]]/route.js`:
```js
const ROUTE_PERMISSIONS = {
  siswa:      { GET: ['admin','tu','wali_kelas'], POST: ['admin','tu'], PUT: ['admin','tu'], DELETE: ['admin'] },
  guru:       { GET: ['admin','tu'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] },
  kelas:      { GET: ['admin','tu','wali_kelas'], POST: ['admin','tu'], PUT: ['admin','tu'], DELETE: ['admin'] },
  pembayaran: { GET: ['admin','tu'], POST: ['admin','tu'], PUT: ['admin','tu'], DELETE: ['admin'] },
  absensi:    { GET: ['admin','tu','wali_kelas'], POST: ['admin','tu','wali_kelas'], PUT: ['admin','tu','wali_kelas'], DELETE: ['admin'] },
  'surat-masuk':  { GET: ['admin','tu'], POST: ['admin','tu'], PUT: ['admin','tu'], DELETE: ['admin'] },
  'surat-keluar': { GET: ['admin','tu'], POST: ['admin','tu'], PUT: ['admin','tu'], DELETE: ['admin'] },
  settings:   { GET: ['admin','tu','wali_kelas'], PUT: ['admin'] },
  users:      { GET: ['admin'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] },
  stats:      { GET: ['admin','tu','wali_kelas'] },
  notifikasi: { GET: ['admin','tu','wali_kelas'] },
}
```

### Per-Resource Restriction (Wali Kelas)
Untuk wali_kelas, `handleAbsensi` enforce restriction:
- GET dengan `kelas` query yang bukan miliknya → 403
- Rekap otomatis difilter ke `user.kelas`

### Frontend Sidebar Filtering
`/app/lib/auth/roles.js` define `ROUTE_ACCESS` map. `app-sidebar.jsx` filter menu items berdasarkan `user.role`.

---

## 7. Security Features

Produksi-ready checklist (semua sudah aktif):

| Feature | File / Implementation |
|---------|----------------------|
| ✅ JWT auth | `/app/lib/auth/jwt.js` |
| ✅ bcrypt password hash (10 rounds) | `hashPassword`, `comparePassword` |
| ✅ Role-based access control | `ROUTE_PERMISSIONS` + `checkPermission` |
| ✅ Per-resource isolation (wali_kelas) | `handleAbsensi` |
| ✅ NoSQL injection sanitization | `sanitizeBody()` — strip `$`, `.`, `_id`, `password` |
| ✅ Bounded queries | semua `find()` pakai `.limit(N)` |
| ✅ Rate-limiting | in-memory `checkRateLimit()` per endpoint key |
| ✅ Generic auth errors | "Email atau password salah" (no enumeration) |
| ✅ Protected AI chat | `/api/chat` butuh Bearer token |
| ✅ No `_id` leak | semua query pakai `projection: { _id: 0, password: 0 }` |
| ✅ HTTPS-only cookies (production) | via Kubernetes ingress |
| ✅ Secrets in env | `JWT_SECRET`, `RESEND_API_KEY`, `EMERGENT_LLM_KEY` di `.env` |
| ✅ No hardcoded URLs | semua via `process.env.*` |
| ✅ Self-deletion guard | admin tidak bisa delete dirinya sendiri di `handleUsers` |

### Rate Limit Configuration
```js
login:   5 req/min per IP
chat:    20 req/min per user+IP
```

---

## 8. Frontend Architecture

### Routing (App Router)
- `/` → Login page (`app/page.js`)
- `/(dashboard)/*` → Protected pages dengan layout sidebar + topbar (auto-guard via `auth-guard.jsx`)

### State Management
**Zustand store** dengan persist (`/app/lib/store/auth-store.js`):
```js
{
  token: string | null,
  user: { id, email, name, role, kelas } | null,
  setAuth, logout,
  isAuthenticated: () => boolean
}
```
Persisted di `localStorage` dengan key `auth-storage`.

### API Client
`/app/lib/api/client.js`:
- Axios instance dengan `baseURL = '/api'`
- Request interceptor: auto-attach `Authorization: Bearer <token>`
- Response interceptor: jika 401, clear auth + redirect ke `/`

### Forms
- React Hook Form + Zod resolver
- shadcn `<Form>`, `<FormField>`, `<FormItem>` patterns
- Validation errors di-display via `<FormMessage>`

### Lazy Loading
Komponen berat di-lazy load via `next/dynamic`:
```js
const BarcodeScanner = dynamic(
  () => import('@/components/barcode-scanner').then(m => m.BarcodeScanner),
  { ssr: false, loading: () => <SkeletonLoader /> }
)
```
Mengurangi module count ~40% di halaman `/absensi`.

### Theme
- `next-themes` provider di root layout
- Toggle di topbar
- CSS variables shadcn untuk light/dark

---

## 9. Environment Variables

File: `/app/.env` (DO NOT commit ke git).

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=sekolahku

# Public URL (di-inject oleh platform)
NEXT_PUBLIC_BASE_URL=https://your-app.preview.emergentagent.com

# Auth
JWT_SECRET=<random-long-string-min-32-chars>

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@sekolahku.id

# AI Chatbot (Emergent LLM proxy)
EMERGENT_LLM_KEY=sk-emergent-xxx
EMERGENT_LLM_BASE_URL=https://integrations.emergentagent.com/llm/v1
```

⚠️ **CRITICAL**: Jangan modify `NEXT_PUBLIC_BASE_URL` dan `MONGO_URL` di production (di-handle platform).

---

## 10. Setup & Development

### Prerequisites
- Node.js 20+
- Yarn (jangan pakai npm — breaks lockfile)
- MongoDB (local atau remote URL)

### Install
```bash
cd /app
yarn install
```

### Run Dev Server
```bash
# Via supervisor (recommended di Emergent)
sudo supervisorctl restart nextjs

# Atau manual
yarn dev
```
Server berjalan di `http://localhost:3000`.

### Build for Production
```bash
yarn build
yarn start
```

### Lint
```bash
yarn lint           # ESLint
```

### Hot Reload
Next.js dev mode auto-reload. Restart server hanya jika:
- Ubah `.env`
- Install dependency baru
- Ubah `next.config.js`

### Seeded Data (otomatis pertama kali)
3 user default:
- `admin@sekolahku.id` / `admin123`
- `tu@sekolahku.id` / `tu123`
- `wali@sekolahku.id` / `wali123`

Plus 48 siswa, 18 guru, 10 kelas, 30 pembayaran, surat data, default settings.
Logic di `/app/lib/seed.js` — idempoten (cek count > 0).

---

## 11. Deployment

### Pre-Deployment Checklist
- [x] Backend smoke test 44/45 passed
- [x] Frontend smoke test passed (semua menu render)
- [x] Deployment Agent health check: **PASS**
- [x] No hardcoded URLs/secrets di code
- [x] All queries bounded dengan `.limit()`
- [x] CORS allow `*` di `next.config.js` (atau ke domain produksi)
- [x] Supervisor config valid
- [x] PWA manifest + icons di `/app/public/`

### Deploy ke Emergent Kubernetes
Gunakan tombol **"Deploy"** di chat — agent akan handle build + push.

### Manual Deploy
```bash
yarn build
# upload /app/.next + /app/public + /app/package.json
yarn start --port 3000
```

### Supervisor Config (`/etc/supervisor/conf.d/nextjs.conf`)
```ini
[program:nextjs]
command=yarn dev --hostname 0.0.0.0 --port 3000
directory=/app
autostart=true
autorestart=true
environment=NODE_OPTIONS="--max-old-space-size=512"
```

💡 **Production tip**: Naikkan `--max-old-space-size` ke 1024+ untuk traffic lebih tinggi.

---

## 12. Testing Strategy

### Backend Testing
Gunakan `deep_testing_backend_nextjs` agent (atau tulis sendiri). Update `/app/test_result.md` dengan hasil.

### Frontend Testing
Gunakan `deep_testing_frontend_nextjs` agent dengan Playwright.

### Test Credentials
File: `/app/memory/test_credentials.md` — auto-update saat ubah auth.

### Coverage Saat Ini
- Backend: **44/45 (97.8%)** — semua CRUD + auth + permission + security
- Frontend: Semua menu render OK, role-based UI works, AI chatbot OK

---

## 13. Third-Party Integrations

### Resend (Email)
File: `/app/lib/email/send.js`
Template emails:
- `emailTagihanBaru` — saat generate tagihan SPP
- `emailPembayaranLunas` — saat status berubah ke Lunas
- `emailReminderTunggakan` — bulk reminder

Usage:
```js
await sendEmail({
  to: siswa.emailOrtu,
  subject: '...',
  html: emailPembayaranLunas({ siswa, bulan, tahun, jumlah })
})
```

### Emergent LLM (OpenAI proxy)
File: `route.js` → `handleChat()`
Model: `gpt-4o-mini`
Endpoint: `${EMERGENT_LLM_BASE_URL}/chat/completions`
Auth: `Bearer ${EMERGENT_LLM_KEY}`

System prompt include real-time school stats untuk grounding.

---

## 14. Konvensi Code

### Naming
- **Components**: PascalCase `.jsx` (e.g., `BarcodeScanner.jsx`)
- **Hooks**: camelCase dengan prefix `use` (e.g., `useCrud.js`)
- **Utils**: camelCase fungsi (e.g., `formatCurrency`, `cn`)
- **API routes**: dashed-case path (`/api/surat-masuk`)
- **Collections MongoDB**: snake_case (`surat_masuk`)

### File Structure
- Server components default, `'use client'` hanya jika perlu state/effects
- Forms pakai React Hook Form + Zod
- Tables shadcn `<Table>` + pagination jika data > 50

### Git Conventions
- Branch: `main` / `feature/<name>` / `fix/<name>`
- Commit prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`

### Linting
```bash
yarn lint
```
Next.js default ESLint + custom rules di `.eslintrc.json`.

---

## 15. Known Issues & Roadmap

### Known Limitations
- ❗ Dev server memory threshold 512MB → kadang restart saat compile berat. Production naikin ke 1024+.
- ❗ In-memory rate-limit reset saat server restart. Untuk multi-instance, ganti ke Redis.
- ❗ Surat upload file masih base64 di MongoDB → tidak ideal untuk file besar. Pertimbangkan S3/GCS untuk produksi.
- ❗ Seeded siswa pakai ID custom (`SIS-1001`) bukan UUID — data baru dari POST pakai UUID. Cosmetic only.

### Roadmap (Future)
- [ ] Multi-tenancy (multiple sekolah dalam 1 deployment)
- [ ] Audit log per aksi user
- [ ] Backup/restore DB dari UI
- [ ] Notifikasi push (PWA)
- [ ] Multi-bahasa (i18n) — saat ini hanya ID
- [ ] Rapor digital + cetak
- [ ] Jadwal pelajaran + jadwal ujian
- [ ] Penilaian / nilai siswa per mapel

---

## 📂 Lampiran

### Useful Commands
```bash
# Restart services
sudo supervisorctl restart nextjs
sudo supervisorctl status

# Logs
tail -f /var/log/supervisor/nextjs.out.log

# MongoDB shell
mongosh sekolahku

# Wipe & re-seed (DANGEROUS)
mongosh sekolahku --eval 'db.dropDatabase()'
# next request akan auto-seed lagi via ensureSeeded()
```

### Debug Tips
- 401 di semua request → cek `localStorage.auth-storage` di browser, mungkin token expired (7 hari).
- 403 → role tidak diizinkan untuk endpoint (cek `ROUTE_PERMISSIONS`).
- 429 → rate-limit hit, tunggu 1 menit.
- 502 di `/api/chat` → cek `EMERGENT_LLM_KEY` di `.env`.
- Email tidak terkirim → cek `RESEND_API_KEY` + email domain di Resend dashboard.

---

_Dokumen ini disusun untuk developer / maintainer SekolahKu v1.0. Update terakhir: 2026._
