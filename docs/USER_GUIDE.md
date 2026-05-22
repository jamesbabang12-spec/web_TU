# 📘 Panduan Pengguna SekolahKu

> **Sistem Tata Usaha Sekolah Digital**
> Versi: 1.0 • Bahasa: Indonesia

---

## Daftar Isi

1. [Pengenalan](#1-pengenalan)
2. [Login & Hak Akses](#2-login--hak-akses)
3. [Dashboard](#3-dashboard)
4. [Menu Data Siswa](#4-menu-data-siswa)
5. [Menu Data Guru](#5-menu-data-guru)
6. [Menu Data Kelas](#6-menu-data-kelas)
7. [Menu Pembayaran SPP](#7-menu-pembayaran-spp)
8. [Menu Absensi Siswa](#8-menu-absensi-siswa)
9. [Menu Surat Menyurat](#9-menu-surat-menyurat)
10. [Menu Pengaturan (Settings)](#10-menu-pengaturan-settings)
11. [Menu Manajemen User](#11-menu-manajemen-user)
12. [AI Chatbot Asisten](#12-ai-chatbot-asisten)
13. [Export Data (Excel & PDF)](#13-export-data-excel--pdf)
14. [Mode Gelap / Terang](#14-mode-gelap--terang)
15. [PWA - Install di HP / Desktop](#15-pwa---install-di-hp--desktop)
16. [FAQ & Troubleshooting](#16-faq--troubleshooting)

---

## 1. Pengenalan

**SekolahKu** adalah aplikasi web untuk mengelola administrasi sekolah secara digital. Aplikasi ini mendukung:

- 📚 Manajemen data siswa, guru, dan kelas
- 💳 Pengelolaan pembayaran SPP + invoice via email
- ✅ Absensi siswa (manual atau scan QR / Barcode kartu)
- 📨 Surat masuk & surat keluar
- 🤖 AI Chatbot untuk bantuan cepat
- 📊 Laporan & rekap otomatis
- 📤 Export ke Excel / PDF
- 🎨 Login page yang bisa di-custom (logo sekolah, nama, tagline)

### Spesifikasi minimum
- **Browser**: Chrome / Edge / Firefox / Safari versi terbaru
- **Internet**: Untuk sinkronisasi data
- **Resolusi**: Responsive (HP, tablet, desktop)
- **Kamera**: Opsional, hanya untuk fitur Scan QR Absensi

---

## 2. Login & Hak Akses

### Cara Login

1. Buka URL aplikasi di browser.
2. Masukkan **Email** dan **Password** yang diberikan admin sekolah.
3. Centang "Ingat saya" jika ingin auto-login di perangkat tersebut.
4. Klik **Masuk**.

### 3 Tipe Akun (Role)

| Role | Akses |
|------|-------|
| **Admin** | Akses penuh ke semua menu, termasuk manajemen user dan settings sekolah |
| **Tata Usaha (TU)** | Akses ke Siswa/Guru/Kelas/Pembayaran/Absensi/Surat. Tidak bisa edit user atau settings |
| **Wali Kelas** | Akses terbatas — fokus ke Absensi & data siswa di kelasnya sendiri |

### Lupa Password?
Hubungi admin sekolah Anda untuk reset password melalui menu **Manajemen User**.

### Logout
Klik avatar/nama Anda di pojok kanan atas → pilih **Logout**.

---

## 3. Dashboard

Halaman pertama setelah login menampilkan ringkasan operasional sekolah:

- **Kartu Statistik**: Total Siswa, Total Guru, Total Kelas, Total Pembayaran Hari Ini
- **Grafik Pemasukan vs Pengeluaran** (6 bulan terakhir)
- **Grafik Absensi Mingguan** (Hadir/Izin/Sakit/Alpa)
- **Distribusi Siswa per Jenjang** (SMP vs SMA)
- **Notifikasi** terbaru di topbar

💡 **Tips**: Refresh dashboard untuk update data real-time setelah input transaksi.

---

## 4. Menu Data Siswa

### Akses: Admin & TU & Wali Kelas (read-only)

### Cara menggunakan:

#### Lihat Daftar Siswa
- Buka menu **Data Siswa** di sidebar.
- Gunakan **Search bar** untuk cari nama/NIS.
- Gunakan filter **Kelas** untuk menyaring per kelas.

#### Tambah Siswa Baru
1. Klik tombol **Tambah Siswa** (pojok kanan atas).
2. Isi form:
   - **NIS**: Nomor Induk Siswa (unik)
   - **Nama Lengkap**
   - **Kelas** (dropdown)
   - **Status**: Aktif / Nonaktif
   - **Email Siswa** (opsional)
   - **Email Orang Tua** (untuk notifikasi SPP)
   - **Nama Orang Tua**
   - **Telepon Orang Tua**
3. Klik **Simpan**.

#### Edit / Hapus Siswa
- Klik ikon titik tiga (⋮) di kolom Aksi.
- Pilih **Edit** atau **Hapus**.

#### Cetak Kartu QR Absensi 🆕
1. Klik ikon titik tiga (⋮) pada siswa.
2. Pilih **Kartu QR Absensi**.
3. Akan muncul dialog dengan:
   - QR Code berisi NIS siswa
   - Nama, NIS, Kelas
4. Klik **Cetak Kartu** → cetak via printer (rekomendasi: kertas tebal/laminating).
5. Kartu QR ini digunakan saat absensi mode **Scan**.

#### Export Daftar Siswa
- Klik tombol **Export Excel** atau **Export PDF** di toolbar atas tabel.

---

## 5. Menu Data Guru

### Akses: Admin & TU

### Cara menggunakan:

#### Tambah / Edit Guru
1. Klik **Tambah Guru**.
2. Isi form: NIP, Nama, Mata Pelajaran (Mapel), Telepon.
3. Klik **Simpan**.

#### Hapus Guru
- Klik ⋮ pada baris → **Hapus**.
- ⚠️ Konfirmasi penghapusan.

#### Export
- Tersedia Export Excel / PDF di toolbar.

---

## 6. Menu Data Kelas

### Akses: Admin & TU

### Cara menggunakan:

- Setiap kelas memiliki: Nama Kelas (mis. 7A, 8B, 10 IPA 1), Tingkat (SMP/SMA), Wali Kelas, jumlah siswa.
- Klik **Tambah Kelas** untuk menambah kelas baru.
- Pilih Wali Kelas dari dropdown (otomatis ambil dari Data Guru).

💡 **Tips**: Pastikan kelas dibuat dulu sebelum menambah siswa, karena field Kelas pada Siswa mengambil dari sini.

---

## 7. Menu Pembayaran SPP

### Akses: Admin & TU

### Cara menggunakan:

#### Lihat Daftar Tagihan
- Tabel menampilkan: Siswa, Bulan/Tahun, Jumlah, Status (Lunas/Belum Lunas), Metode, Tanggal Bayar.
- Filter berdasarkan **Status** dan **Bulan**.

#### Generate Tagihan SPP Massal (per bulan)
1. Klik tombol **Generate Tagihan**.
2. Pilih **Bulan** dan **Tahun**.
3. Klik **Buat Tagihan**.
4. Sistem akan otomatis:
   - Buat tagihan untuk semua siswa **Aktif**
   - Skip siswa yang sudah punya tagihan untuk bulan/tahun yang sama (idempoten)
   - Jumlah tagihan otomatis berdasarkan jenjang (SMP vs SMA dari Settings)

#### Tandai Lunas
1. Pada baris dengan status **Belum Lunas**, klik tombol **Lunas** / **Bayar**.
2. Pilih **Metode Pembayaran**: Tunai / Transfer / QRIS / dll.
3. Klik **Konfirmasi**.
4. Status berubah ke **Lunas**, tanggal bayar otomatis.
5. 📧 Email konfirmasi pembayaran otomatis dikirim ke email orang tua (jika diisi).

#### Email Reminder Tunggakan
- Admin dapat trigger email reminder ke siswa yang belum bayar.

#### Export
- **Excel**: Untuk laporan keuangan.
- **PDF**: Untuk arsip kuitansi.

---

## 8. Menu Absensi Siswa

### Akses: Admin / TU / Wali Kelas (kelas sendiri)

Absensi memiliki **2 mode**: Manual & Scan QR/Barcode.

### 8.1 Pilih Periode
- **Tanggal**: Pilih dari kalender (default hari ini)
- **Kelas**: Pilih dari dropdown
- 💡 Jika absensi sudah pernah disimpan untuk kombinasi tanggal+kelas, data sebelumnya akan **otomatis termuat**.

### 8.2 Mode Manual
1. Klik tab **Manual**.
2. Akan tampil daftar siswa di kelas tersebut.
3. Untuk setiap siswa, klik salah satu tombol: **Hadir / Izin / Sakit / Alpa**.
4. Atau klik **Tandai Semua Hadir** untuk shortcut.
5. Klik **Simpan Absensi** di pojok kanan atas.

### 8.3 Mode Scan QR / Barcode 🆕
1. Klik tab **Scan QR / Barcode**.
2. Klik **Mulai Scan** → browser akan minta izin kamera (klik **Allow**).
3. Arahkan kamera ke QR Code di kartu siswa (jarak ~15-30 cm).
4. Sistem otomatis:
   - Cari siswa berdasarkan NIS di QR
   - Tandai siswa sebagai **Hadir**
   - Bunyikan beep konfirmasi
   - Tampilkan di panel **Siswa Tercatat**
5. Jika kamera lebih dari 1 (depan/belakang), klik **Ganti Kamera**.
6. Klik **Simpan Absensi** untuk menyimpan ke database.

💡 **Tips Scan**:
- Pencahayaan cukup terang
- QR Code tidak terlipat / kusam
- Bisa di-scan via HP (browser HP)
- Suara beep bisa di-mute via ikon 🔊/🔇

### 8.4 Reset Absensi
- Klik **Reset** untuk membatalkan input absensi (sebelum Save).

### 8.5 Rekap Bulanan
Di bagian bawah halaman:
- Tabel **Rekap Absensi Bulan [bulan saat ini]**
- Per siswa: total Hadir/Izin/Sakit/Alpa + persentase kehadiran
- Progress bar warna:
  - 🟢 Hijau ≥ 80%
  - 🟡 Kuning ≥ 60%
  - 🔴 Merah < 60%

---

## 9. Menu Surat Menyurat

### Akses: Admin & TU

Dibagi 2 sub-menu / tab: **Surat Masuk** dan **Surat Keluar**.

### Cara menggunakan:

#### Tambah Surat
1. Klik **Tambah Surat Masuk** atau **Tambah Surat Keluar**.
2. Isi form:
   - Nomor Surat
   - Pengirim / Tujuan
   - Perihal
   - Tanggal
   - Status (Diterima/Dikirim/Dibalas/dll)
   - Upload file (opsional)
3. Klik **Simpan**.

#### Filter & Search
- Search by nomor/perihal
- Filter by status & rentang tanggal

#### Export
- Excel / PDF tersedia

---

## 10. Menu Pengaturan (Settings)

### Akses: Admin only

Dibagi beberapa tab:

### 10.1 Profil Sekolah
- Nama Sekolah
- NPSN
- Kepala Sekolah
- Alamat
- Telepon
- Email Sekolah

### 10.2 Pembayaran SPP
- **Tarif SPP SMP** (Rp/bulan)
- **Tarif SPP SMA** (Rp/bulan)
- Digunakan saat **Generate Tagihan** otomatis.

### 10.3 Branding Login Page 🆕
Custom tampilan login agar sesuai identitas sekolah:
- **Logo Sekolah**: Upload file gambar (PNG/JPG) — akan disimpan sebagai base64
- **Tagline App**: Subtitle di bawah nama sekolah
- **Hero Title**: Judul besar di sisi kanan login page
- **Hero Subtitle**: Deskripsi singkat
- **Hero Stats**: 4 angka highlight (mis. 650+ Siswa Aktif, 30 Guru, dll)

Klik **Simpan** untuk apply. Refresh halaman login untuk lihat perubahan.

---

## 11. Menu Manajemen User

### Akses: Admin only

Kelola akun login untuk staff sekolah.

### Cara menggunakan:

#### Tambah User
1. Klik **Tambah User**.
2. Isi form:
   - **Nama**
   - **Email** (akan jadi username login)
   - **Password** (min 6 karakter)
   - **Role**: Admin / TU / Wali Kelas
   - **Kelas** (hanya untuk role Wali Kelas)
3. Klik **Simpan**.

#### Edit / Reset Password User
- Klik ⋮ → **Edit**
- Field Password bisa dikosongkan (tidak ganti) atau diisi password baru.

#### Hapus User
- Klik ⋮ → **Hapus**.
- ⚠️ Admin tidak bisa menghapus akun dirinya sendiri.

💡 **Best Practice**:
- Buat akun terpisah untuk setiap staff (jangan share login).
- Gunakan password minimal 8 karakter.
- Role **Wali Kelas** otomatis dibatasi hanya bisa lihat kelasnya saja.

---

## 12. AI Chatbot Asisten

### Akses: Semua role (perlu login)

Fitur chatbot AI untuk tanya jawab cepat tentang data sekolah.

### Cara menggunakan:
1. Klik ikon chat (lingkaran) di pojok kanan bawah layar.
2. Ketik pertanyaan di kolom input, mis:
   - *"Berapa total siswa di sekolah?"*
   - *"Siapa wali kelas 7A?"*
   - *"Berapa siswa yang belum bayar SPP bulan Juli?"*
   - *"Berapa tarif SPP SMA saat ini?"*
3. Tekan **Send** atau **Enter**.
4. AI akan menjawab berdasarkan data real di sekolah.

💡 **Catatan**:
- Chatbot membaca data sekolah secara real-time.
- Tidak menyimpan data sensitif di chat.
- Bahasa: Indonesia.

---

## 13. Export Data (Excel & PDF)

Hampir semua tabel data mendukung export:

### Export Excel (.xlsx)
- Klik tombol **Export Excel**.
- File otomatis terdownload.
- Bisa dibuka di Excel, Google Sheets, LibreOffice.

### Export PDF
- Klik tombol **Export PDF**.
- Otomatis include kop sekolah (dari Settings).
- Cocok untuk arsip / laporan cetak.

---

## 14. Mode Gelap / Terang

- Klik ikon 🌙 / ☀️ di topbar untuk toggle.
- Pilihan tersimpan otomatis di browser.

---

## 15. PWA - Install di HP / Desktop

SekolahKu adalah **Progressive Web App** — bisa di-install seperti aplikasi native!

### Cara install di HP (Android/iOS):
1. Buka aplikasi di browser HP (Chrome/Safari).
2. Tap menu browser (⋮ atau Share).
3. Pilih **"Add to Home Screen"** / **"Install App"**.
4. Icon SekolahKu akan muncul di home screen.

### Cara install di Desktop:
1. Buka di Chrome / Edge.
2. Klik icon install (➕) di address bar.
3. Klik **Install**.

💡 **Manfaat install**:
- Loading lebih cepat
- Bisa dibuka offline (sebatas cache)
- Ada di home screen / desktop
- Notifikasi push (jika diaktifkan)

---

## 16. FAQ & Troubleshooting

### Q: Saya lupa password, bagaimana?
**A**: Hubungi admin sekolah untuk reset via menu Manajemen User.

### Q: Kamera tidak terdeteksi saat Scan QR?
**A**: 
- Pastikan browser sudah diberi izin kamera (cek di pengaturan browser).
- Coba browser lain (Chrome paling stabil).
- Pastikan tidak ada aplikasi lain yang sedang pakai kamera.

### Q: Saya Wali Kelas tapi tidak bisa input absensi kelas lain?
**A**: Memang by design — Wali Kelas hanya bisa input untuk kelasnya saja. Hubungi admin/TU untuk kelas lain.

### Q: Email konfirmasi SPP tidak terkirim?
**A**: 
- Cek field **Email Orang Tua** sudah terisi benar di data siswa.
- Cek folder Spam.
- Email dikirim via Resend service — kalau bermasalah, hubungi developer.

### Q: Data tidak ter-update setelah edit?
**A**: Refresh halaman dengan Ctrl+Shift+R (hard refresh).

### Q: Bagaimana cara backup data?
**A**: Gunakan menu **Export Excel / PDF** per modul, atau hubungi developer untuk database dump MongoDB.

### Q: Bisa ganti logo & nama sekolah?
**A**: Ya, lewat **Settings → Branding Login Page**. Logo upload jadi base64 (otomatis).

### Q: Saya butuh fitur baru?
**A**: Sampaikan ke admin / developer sekolah Anda.

---

## 📞 Kontak Bantuan

- **Admin Sekolah**: Hubungi Tata Usaha untuk soal akun / data
- **Developer**: Untuk soal teknis (bug, request fitur)

---

_Dokumen ini disusun untuk SekolahKu v1.0. Update terakhir: 2026._
