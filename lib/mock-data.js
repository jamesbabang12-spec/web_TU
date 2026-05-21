// Mock data for the school administration system

export const KELAS_LIST = ['7A','7B','8A','8B','9A','9B','10 IPA 1','10 IPA 2','11 IPA','12 IPA']

export const SISWA_DATA = Array.from({ length: 48 }).map((_, i) => {
  const namaDepan = ['Ahmad','Siti','Budi','Dewi','Eka','Fajar','Gita','Hadi','Indah','Joko','Kirana','Lestari','Made','Nadia','Oki','Putri','Rahmat','Sari','Tono','Umi']
  const namaBelakang = ['Pratama','Wijaya','Saputra','Lestari','Ramadhan','Nugroho','Anggraini','Setiawan','Kusuma','Hartanto']
  const nm = `${namaDepan[i % namaDepan.length]} ${namaBelakang[i % namaBelakang.length]}`
  return {
    id: `SIS-${String(1001 + i)}`,
    nis: `2024${String(1001 + i)}`,
    nama: nm,
    kelas: KELAS_LIST[i % KELAS_LIST.length],
    jenisKelamin: i % 2 === 0 ? 'Laki-laki' : 'Perempuan',
    alamat: `Jl. Pendidikan No. ${i + 1}, Jakarta`,
    telepon: `0812${String(34567890 + i)}`,
    email: `${nm.toLowerCase().replace(' ', '.')}@sekolahku.id`,
    status: i % 9 === 0 ? 'Tidak Aktif' : 'Aktif',
    tanggalMasuk: `2024-07-${String((i % 28) + 1).padStart(2, '0')}`,
  }
})

export const GURU_DATA = Array.from({ length: 18 }).map((_, i) => {
  const namaDepan = ['Drs. Budi','Dra. Siti','Ir. Hartono','M.Pd. Nina','S.Pd. Rendi','Dr. Wahyu','S.Pd. Lina','S.Pd. Maya','Drs. Yusuf','S.Pd. Citra']
  const mapel = ['Matematika','Bahasa Indonesia','Bahasa Inggris','IPA','IPS','PKN','Agama','Olahraga','Seni Budaya','TIK']
  return {
    id: `GR-${String(101 + i)}`,
    nip: `19${70 + (i % 25)}05${String((i % 28) + 1).padStart(2,'0')}1001`,
    nama: namaDepan[i % namaDepan.length],
    mapel: mapel[i % mapel.length],
    jenisKelamin: i % 2 === 0 ? 'Laki-laki' : 'Perempuan',
    telepon: `0813${String(11223344 + i)}`,
    email: `guru${i+1}@sekolahku.id`,
    status: 'Aktif',
  }
})

export const KELAS_DATA = KELAS_LIST.map((k, i) => ({
  id: `KLS-${String(101 + i)}`,
  nama: k,
  tingkat: k.startsWith('7') || k.startsWith('8') || k.startsWith('9') ? 'SMP' : 'SMA',
  waliKelas: GURU_DATA[i % GURU_DATA.length].nama,
  jumlahSiswa: SISWA_DATA.filter(s => s.kelas === k).length,
  ruangan: `R-${String(101 + i)}`,
}))

export const PEMBAYARAN_DATA = SISWA_DATA.slice(0, 30).map((s, i) => ({
  id: `PAY-${String(2001 + i)}`,
  siswaId: s.id,
  namaSiswa: s.nama,
  kelas: s.kelas,
  bulan: ['Januari','Februari','Maret','April','Mei','Juni'][i % 6],
  tahun: 2025,
  jumlah: 500000 + (i % 3) * 50000,
  tanggalBayar: i % 3 === 0 ? null : `2025-0${(i%6)+1}-${String((i%28)+1).padStart(2,'0')}`,
  metode: i % 2 === 0 ? 'Transfer' : 'Tunai',
  status: i % 3 === 0 ? 'Belum Lunas' : 'Lunas',
}))

export const ABSENSI_DATA = SISWA_DATA.slice(0, 20).map((s, i) => ({
  id: `ABS-${String(3001 + i)}`,
  siswaId: s.id,
  nama: s.nama,
  kelas: s.kelas,
  hadir: 18 + (i % 4),
  izin: i % 3,
  sakit: i % 2,
  alpa: i % 5 === 0 ? 1 : 0,
}))

export const SURAT_MASUK = [
  { id: 'SM-001', nomor: '001/SM/2025', tanggal: '2025-06-01', pengirim: 'Dinas Pendidikan Jakarta', perihal: 'Undangan Rapat Koordinasi', status: 'Belum Dibaca' },
  { id: 'SM-002', nomor: '002/SM/2025', tanggal: '2025-06-03', pengirim: 'Komite Sekolah', perihal: 'Laporan Kegiatan', status: 'Dibaca' },
  { id: 'SM-003', nomor: '003/SM/2025', tanggal: '2025-06-05', pengirim: 'Yayasan Pendidikan', perihal: 'Penerimaan Dana BOS', status: 'Dibaca' },
  { id: 'SM-004', nomor: '004/SM/2025', tanggal: '2025-06-10', pengirim: 'PT Penerbit Buku', perihal: 'Penawaran Buku Pelajaran', status: 'Belum Dibaca' },
  { id: 'SM-005', nomor: '005/SM/2025', tanggal: '2025-06-12', pengirim: 'Kepolisian Sektor', perihal: 'Sosialisasi Anti Narkoba', status: 'Dibaca' },
]

export const SURAT_KELUAR = [
  { id: 'SK-001', nomor: '001/SK/2025', tanggal: '2025-06-02', tujuan: 'Dinas Pendidikan Jakarta', perihal: 'Laporan Bulanan', status: 'Terkirim' },
  { id: 'SK-002', nomor: '002/SK/2025', tanggal: '2025-06-04', tujuan: 'Orang Tua Siswa', perihal: 'Pemberitahuan Rapor', status: 'Terkirim' },
  { id: 'SK-003', nomor: '003/SK/2025', tanggal: '2025-06-08', tujuan: 'Yayasan', perihal: 'Permohonan Dana', status: 'Draft' },
  { id: 'SK-004', nomor: '004/SK/2025', tanggal: '2025-06-11', tujuan: 'Dinas Kesehatan', perihal: 'Permohonan Imunisasi', status: 'Terkirim' },
]

export const NOTIFIKASI = [
  { id: 1, judul: 'Pembayaran SPP Baru', deskripsi: 'Ahmad Pratama telah melakukan pembayaran SPP', waktu: '5 menit lalu', tipe: 'success' },
  { id: 2, judul: 'Surat Masuk Baru', deskripsi: 'Surat dari Dinas Pendidikan', waktu: '1 jam lalu', tipe: 'info' },
  { id: 3, judul: 'Tunggakan SPP', deskripsi: '5 siswa belum membayar SPP bulan ini', waktu: '3 jam lalu', tipe: 'warning' },
  { id: 4, judul: 'Absensi Kelas 10 IPA', deskripsi: '3 siswa tidak masuk hari ini', waktu: 'Kemarin', tipe: 'warning' },
]

export const PEMASUKAN_CHART = [
  { bulan: 'Jan', pemasukan: 42500000, pengeluaran: 28000000 },
  { bulan: 'Feb', pemasukan: 45000000, pengeluaran: 30000000 },
  { bulan: 'Mar', pemasukan: 48000000, pengeluaran: 29500000 },
  { bulan: 'Apr', pemasukan: 46500000, pengeluaran: 31000000 },
  { bulan: 'Mei', pemasukan: 51000000, pengeluaran: 32000000 },
  { bulan: 'Jun', pemasukan: 55000000, pengeluaran: 33500000 },
]

export const ABSENSI_CHART = [
  { hari: 'Sen', hadir: 420, izin: 12, sakit: 8, alpa: 4 },
  { hari: 'Sel', hadir: 415, izin: 10, sakit: 12, alpa: 7 },
  { hari: 'Rab', hadir: 430, izin: 8, sakit: 5, alpa: 1 },
  { hari: 'Kam', hadir: 418, izin: 14, sakit: 9, alpa: 3 },
  { hari: 'Jum', hadir: 425, izin: 11, sakit: 6, alpa: 2 },
]

export const KELAS_DISTRIBUSI = [
  { name: 'SMP', value: 240, fill: 'hsl(var(--chart-1))' },
  { name: 'SMA', value: 204, fill: 'hsl(var(--chart-2))' },
]
