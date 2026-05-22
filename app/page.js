// Server Component - fetch branding di server agar tidak ada flash hydration
import { getCollection } from '@/lib/db'
import { ensureSeeded } from '@/lib/seed'
import LoginForm from '@/components/login-form'

// Tidak boleh di-cache static karena branding bisa berubah via Settings
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getBranding() {
  try {
    await ensureSeeded()
    const col = await getCollection('settings')
    const s = await col.findOne({}, {
      projection: {
        _id: 0,
        namaSekolah: 1,
        taglineApp: 1,
        logoUrl: 1,
        heroTitle: 1,
        heroSubtitle: 1,
        heroStats: 1,
      },
    })
    return {
      namaSekolah: s?.namaSekolah || 'SekolahKu',
      taglineApp: s?.taglineApp || 'Tata Usaha Digital',
      logoUrl: s?.logoUrl || '',
      heroTitle: s?.heroTitle || 'Kelola Administrasi Sekolah dengan Mudah & Efisien',
      heroSubtitle: s?.heroSubtitle || 'Platform terintegrasi untuk siswa, guru, pembayaran SPP, absensi, dan administrasi sekolah modern.',
      heroStats: Array.isArray(s?.heroStats) && s.heroStats.length === 4
        ? s.heroStats
        : [
            { icon: 'Users', value: '444+', label: 'Manajemen Siswa' },
            { icon: 'BookOpen', value: '24', label: 'Mata Pelajaran' },
            { icon: 'ClipboardCheck', value: '97%', label: 'Kehadiran Hari Ini' },
            { icon: 'Wallet', value: '89%', label: 'SPP Lunas' },
          ],
    }
  } catch (e) {
    // Fallback aman jika DB tidak ready
    return {
      namaSekolah: 'SekolahKu',
      taglineApp: 'Tata Usaha Digital',
      logoUrl: '',
      heroTitle: 'Kelola Administrasi Sekolah dengan Mudah & Efisien',
      heroSubtitle: 'Platform terintegrasi untuk siswa, guru, pembayaran SPP, absensi, dan administrasi sekolah modern.',
      heroStats: [
        { icon: 'Users', value: '444+', label: 'Manajemen Siswa' },
        { icon: 'BookOpen', value: '24', label: 'Mata Pelajaran' },
        { icon: 'ClipboardCheck', value: '97%', label: 'Kehadiran Hari Ini' },
        { icon: 'Wallet', value: '89%', label: 'SPP Lunas' },
      ],
    }
  }
}

export default async function Page() {
  const branding = await getBranding()
  return <LoginForm branding={branding} />
}
