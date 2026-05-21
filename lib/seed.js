import { getCollection } from '@/lib/db'
import { hashPassword, ROLES } from '@/lib/auth/jwt'
import { v4 as uuidv4 } from 'uuid'
import { SISWA_DATA, GURU_DATA, KELAS_DATA, PEMBAYARAN_DATA, SURAT_MASUK, SURAT_KELUAR } from '@/lib/mock-data'

let seeded = false

export async function ensureSeeded() {
  if (seeded) return
  const users = await getCollection('users')
  const count = await users.countDocuments()
  if (count > 0) { seeded = true; return }

  // Seed users
  const defaultUsers = [
    { id: uuidv4(), email: 'admin@sekolahku.id', password: await hashPassword('admin123'), name: 'Pak Admin', role: ROLES.ADMIN, createdAt: new Date() },
    { id: uuidv4(), email: 'tu@sekolahku.id', password: await hashPassword('tu123'), name: 'Ibu Sari (TU)', role: ROLES.TU, createdAt: new Date() },
    { id: uuidv4(), email: 'wali@sekolahku.id', password: await hashPassword('wali123'), name: 'Pak Budi (Wali Kelas)', role: ROLES.WALI_KELAS, kelas: '7A', createdAt: new Date() },
  ]
  await users.insertMany(defaultUsers)

  // Seed master data
  const collections = {
    siswa: SISWA_DATA,
    guru: GURU_DATA,
    kelas: KELAS_DATA,
    pembayaran: PEMBAYARAN_DATA,
    surat_masuk: SURAT_MASUK,
    surat_keluar: SURAT_KELUAR,
  }
  for (const [name, data] of Object.entries(collections)) {
    const col = await getCollection(name)
    const c = await col.countDocuments()
    if (c === 0 && data.length) {
      await col.insertMany(data.map(d => ({ ...d, createdAt: new Date() })))
    }
  }

  // Settings: SPP per jenjang
  const settings = await getCollection('settings')
  const sc = await settings.countDocuments()
  if (sc === 0) {
    await settings.insertOne({
      id: uuidv4(),
      sppSMP: 400000,
      sppSMA: 600000,
      namaSekolah: 'SMA SekolahKu',
      npsn: '12345678',
      kepalaSekolah: 'Drs. Budi Pratama, M.Pd',
      alamat: 'Jl. Pendidikan No. 1, Jakarta',
      telepon: '021-12345678',
      emailSekolah: 'info@sekolahku.id',
      createdAt: new Date(),
    })
  }

  seeded = true
}
