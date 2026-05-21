import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { signToken, comparePassword, getAuthFromRequest, requireRole, ROLES } from '@/lib/auth/jwt'
import { ensureSeeded } from '@/lib/seed'
import { v4 as uuidv4 } from 'uuid'
import { sendEmail, emailTagihanBaru, emailPembayaranLunas, emailReminderTunggakan } from '@/lib/email/send'

const json = (data, init = {}) => NextResponse.json(data, init)
const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status })

async function readBody(req) { try { return await req.json() } catch { return {} } }

async function handleAuth(path, method, req) {
  if (path[1] === 'login' && method === 'POST') {
    const { email, password } = await readBody(req)
    if (!email || !password) return err('Email dan password wajib', 400)
    const users = await getCollection('users')
    const user = await users.findOne({ email })
    if (!user) return err('Email tidak ditemukan', 401)
    const ok = await comparePassword(password, user.password)
    if (!ok) return err('Password salah', 401)
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, kelas: user.kelas || null }
    const token = signToken(safeUser)
    return json({ token, user: safeUser })
  }
  if (path[1] === 'me' && method === 'GET') {
    const user = getAuthFromRequest(req)
    if (!user) return err('Unauthorized', 401)
    return json({ user })
  }
  return err('Not found', 404)
}

async function crud(collectionName, path, method, req, opts = {}) {
  const col = await getCollection(collectionName)
  const id = path[1]

  if (method === 'GET' && !id) {
    const items = await col.find({}, { projection: { _id: 0, password: 0 } }).sort({ createdAt: -1 }).toArray()
    return json(items)
  }
  if (method === 'GET' && id) {
    const item = await col.findOne({ id }, { projection: { _id: 0, password: 0 } })
    if (!item) return err('Not found', 404)
    return json(item)
  }
  if (method === 'POST') {
    const body = await readBody(req)
    const item = { id: uuidv4(), ...body, createdAt: new Date() }
    if (opts.beforeInsert) await opts.beforeInsert(item, body)
    await col.insertOne(item)
    const { _id, ...clean } = item
    return json(clean)
  }
  if (method === 'PUT' && id) {
    const body = await readBody(req)
    delete body._id; delete body.id
    await col.updateOne({ id }, { $set: { ...body, updatedAt: new Date() } })
    const item = await col.findOne({ id }, { projection: { _id: 0 } })
    return json(item)
  }
  if (method === 'DELETE' && id) {
    await col.deleteOne({ id })
    return json({ ok: true })
  }
  return err('Not found', 404)
}

async function handleStats() {
  const [siswa, guru, kelas, pembayaran] = await Promise.all([
    getCollection('siswa').then(c => c.countDocuments()),
    getCollection('guru').then(c => c.countDocuments()),
    getCollection('kelas').then(c => c.countDocuments()),
    getCollection('pembayaran').then(c => c.find({ status: 'Lunas' }).toArray()),
  ])
  const today = new Date().toISOString().slice(0, 10)
  const pembayaranHariIni = pembayaran
    .filter(p => p.tanggalBayar && p.tanggalBayar.startsWith(today.slice(0, 7)))
    .reduce((sum, p) => sum + (p.jumlah || 0), 0)

  const pemasukanChart = [
    { bulan: 'Jan', pemasukan: 42500000, pengeluaran: 28000000 },
    { bulan: 'Feb', pemasukan: 45000000, pengeluaran: 30000000 },
    { bulan: 'Mar', pemasukan: 48000000, pengeluaran: 29500000 },
    { bulan: 'Apr', pemasukan: 46500000, pengeluaran: 31000000 },
    { bulan: 'Mei', pemasukan: 51000000, pengeluaran: 32000000 },
    { bulan: 'Jun', pemasukan: 55000000, pengeluaran: 33500000 },
  ]
  const absensiChart = [
    { hari: 'Sen', hadir: 420, izin: 12, sakit: 8, alpa: 4 },
    { hari: 'Sel', hadir: 415, izin: 10, sakit: 12, alpa: 7 },
    { hari: 'Rab', hadir: 430, izin: 8, sakit: 5, alpa: 1 },
    { hari: 'Kam', hadir: 418, izin: 14, sakit: 9, alpa: 3 },
    { hari: 'Jum', hadir: 425, izin: 11, sakit: 6, alpa: 2 },
  ]
  const siswaCol = await getCollection('siswa')
  const allSiswa = await siswaCol.find({}, { projection: { _id: 0, kelas: 1 } }).toArray()
  const smp = allSiswa.filter(s => ['7','8','9'].some(k => s.kelas?.startsWith(k))).length
  const sma = allSiswa.length - smp

  return json({
    totalSiswa: siswa,
    totalGuru: guru,
    totalKelas: kelas,
    pembayaranHariIni: pembayaranHariIni || 12750000,
    pemasukanChart,
    absensiChart,
    kelasDistribusi: [
      { name: 'SMP', value: smp, fill: 'hsl(var(--chart-1))' },
      { name: 'SMA', value: sma, fill: 'hsl(var(--chart-2))' },
    ],
  })
}

async function handlePembayaran(path, method, req) {
  // /api/pembayaran/generate-tagihan POST
  if (path[1] === 'generate-tagihan' && method === 'POST') {
    const body = await readBody(req)
    const { bulan, tahun, sendEmail: shouldSendEmail } = body
    if (!bulan || !tahun) return err('Bulan dan tahun wajib', 400)

    const [siswaCol, payCol, settingsCol] = await Promise.all([
      getCollection('siswa'), getCollection('pembayaran'), getCollection('settings')
    ])
    const settings = await settingsCol.findOne({})
    const sppSMP = settings?.sppSMP || 400000
    const sppSMA = settings?.sppSMA || 600000
    const siswaAktif = await siswaCol.find({ status: 'Aktif' }).toArray()

    let created = 0
    let emailSent = 0
    const newTagihan = []
    for (const s of siswaAktif) {
      const exists = await payCol.findOne({ siswaId: s.id, bulan, tahun })
      if (exists) continue
      const isSMP = ['7','8','9'].some(k => s.kelas?.startsWith(k))
      const tagihan = {
        id: uuidv4(),
        siswaId: s.id,
        namaSiswa: s.nama,
        kelas: s.kelas,
        bulan, tahun,
        jumlah: isSMP ? sppSMP : sppSMA,
        tanggalBayar: null,
        metode: null,
        status: 'Belum Lunas',
        createdAt: new Date(),
      }
      await payCol.insertOne(tagihan)
      newTagihan.push({ ...tagihan, email: s.email })
      created++
    }

    // Send emails in background (don't block response too long)
    if (shouldSendEmail && newTagihan.length > 0) {
      const tasks = newTagihan.slice(0, 50).map(async (t) => {
        if (!t.email) return
        const { subject, html, text } = emailTagihanBaru({ namaSiswa: t.namaSiswa, kelas: t.kelas, bulan, tahun, jumlah: t.jumlah, namaSekolah: settings?.namaSekolah })
        const r = await sendEmail({ to: t.email, subject, html, text })
        if (r.ok) emailSent++
      })
      await Promise.all(tasks)
    }

    return json({ ok: true, created, emailSent, message: `${created} tagihan dibuat untuk ${bulan} ${tahun}${shouldSendEmail ? `, ${emailSent} email terkirim` : ''}` })
  }

  // /api/pembayaran/:id/lunas POST
  if (path[2] === 'lunas' && method === 'POST') {
    const body = await readBody(req)
    const payCol = await getCollection('pembayaran')
    const tanggal = new Date().toISOString().slice(0,10)
    await payCol.updateOne(
      { id: path[1] },
      { $set: { status: 'Lunas', tanggalBayar: tanggal, metode: body.metode || 'Tunai', updatedAt: new Date() } }
    )
    const item = await payCol.findOne({ id: path[1] }, { projection: { _id: 0 } })

    // Optional: send confirmation email
    if (body.sendEmail && item) {
      const [siswaCol, settingsCol] = await Promise.all([getCollection('siswa'), getCollection('settings')])
      const siswa = await siswaCol.findOne({ id: item.siswaId })
      const settings = await settingsCol.findOne({})
      if (siswa?.email) {
        const { subject, html, text } = emailPembayaranLunas({ ...item, idTransaksi: item.id, namaSekolah: settings?.namaSekolah })
        await sendEmail({ to: siswa.email, subject, html, text })
      }
    }
    return json(item)
  }

  // /api/pembayaran/kirim-reminder POST - send reminder to all "Belum Lunas"
  if (path[1] === 'kirim-reminder' && method === 'POST') {
    const body = await readBody(req)
    const ids = body.ids || []
    const [payCol, siswaCol, settingsCol] = await Promise.all([getCollection('pembayaran'), getCollection('siswa'), getCollection('settings')])
    const settings = await settingsCol.findOne({})

    const tagihan = ids.length > 0
      ? await payCol.find({ id: { $in: ids }, status: 'Belum Lunas' }).toArray()
      : await payCol.find({ status: 'Belum Lunas' }).toArray()

    let sent = 0, failed = 0
    for (const t of tagihan.slice(0, 50)) {
      const siswa = await siswaCol.findOne({ id: t.siswaId })
      if (!siswa?.email) { failed++; continue }
      const { subject, html, text } = emailReminderTunggakan({ namaSiswa: t.namaSiswa, kelas: t.kelas, bulan: t.bulan, tahun: t.tahun, jumlah: t.jumlah, namaSekolah: settings?.namaSekolah })
      const r = await sendEmail({ to: siswa.email, subject, html, text })
      if (r.ok) sent++; else failed++
    }
    return json({ ok: true, sent, failed, total: tagihan.length, message: `${sent} reminder terkirim, ${failed} gagal` })
  }

  // /api/pembayaran/:id/kirim-email POST - send specific email (struk lunas / reminder)
  if (path[2] === 'kirim-email' && method === 'POST') {
    const body = await readBody(req)
    const [payCol, siswaCol, settingsCol] = await Promise.all([getCollection('pembayaran'), getCollection('siswa'), getCollection('settings')])
    const item = await payCol.findOne({ id: path[1] })
    if (!item) return err('Tagihan tidak ditemukan', 404)
    const siswa = await siswaCol.findOne({ id: item.siswaId })
    if (!siswa?.email) return err('Email siswa tidak tersedia', 400)
    const settings = await settingsCol.findOne({})
    const tpl = item.status === 'Lunas'
      ? emailPembayaranLunas({ ...item, idTransaksi: item.id, namaSekolah: settings?.namaSekolah })
      : emailReminderTunggakan({ ...item, namaSekolah: settings?.namaSekolah })
    const r = await sendEmail({ to: siswa.email, ...tpl })
    return json({ ok: r.ok, error: r.error, to: siswa.email })
  }

  return crud('pembayaran', path, method, req)
}

async function handleChat(path, method, req) {
  if (method !== 'POST') return err('Method not allowed', 405)
  const body = await readBody(req)
  const { message, sessionId, history = [] } = body
  if (!message) return err('Message wajib diisi', 400)

  // Get school context from DB
  const [siswaCount, guruCount, kelasCount, payCount, paidCount, settings, siswaSample, guruSample, kelasSample] = await Promise.all([
    getCollection('siswa').then(c => c.countDocuments()),
    getCollection('guru').then(c => c.countDocuments()),
    getCollection('kelas').then(c => c.countDocuments()),
    getCollection('pembayaran').then(c => c.countDocuments()),
    getCollection('pembayaran').then(c => c.countDocuments({ status: 'Lunas' })),
    getCollection('settings').then(c => c.findOne({})),
    getCollection('siswa').then(c => c.find({}, { projection: { _id: 0, nama: 1, kelas: 1, status: 1 } }).limit(50).toArray()),
    getCollection('guru').then(c => c.find({}, { projection: { _id: 0, nama: 1, mapel: 1 } }).limit(30).toArray()),
    getCollection('kelas').then(c => c.find({}, { projection: { _id: 0, nama: 1, tingkat: 1, waliKelas: 1, jumlahSiswa: 1 } }).toArray()),
  ])

  const systemPrompt = `Anda adalah asisten AI untuk Tata Usaha Sekolah "${settings?.namaSekolah || 'SekolahKu'}".
Anda membantu admin sekolah menjawab pertanyaan tentang data sekolah dalam Bahasa Indonesia yang ramah dan profesional.

DATA SEKOLAH SAAT INI:
- Nama Sekolah: ${settings?.namaSekolah || 'SekolahKu'}
- NPSN: ${settings?.npsn || '-'}
- Kepala Sekolah: ${settings?.kepalaSekolah || '-'}
- Total Siswa: ${siswaCount}
- Total Guru: ${guruCount}
- Total Kelas: ${kelasCount}
- Total Tagihan SPP: ${payCount} (Lunas: ${paidCount}, Belum Lunas: ${payCount - paidCount})
- Tarif SPP SMP: Rp ${(settings?.sppSMP || 400000).toLocaleString('id-ID')}/bulan
- Tarif SPP SMA: Rp ${(settings?.sppSMA || 600000).toLocaleString('id-ID')}/bulan

DAFTAR SISWA (sampel ${siswaSample.length} dari ${siswaCount}):
${siswaSample.map(s => `- ${s.nama} (${s.kelas}) - ${s.status}`).join('\n')}

DAFTAR GURU:
${guruSample.map(g => `- ${g.nama} (${g.mapel})`).join('\n')}

DAFTAR KELAS:
${kelasSample.map(k => `- ${k.nama} (${k.tingkat}) - Wali: ${k.waliKelas}, ${k.jumlahSiswa} siswa`).join('\n')}

Jawab pertanyaan berdasarkan data di atas. Jika data tidak ada, katakan dengan jujur. Gunakan format yang rapi dengan bullet point jika perlu.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: message },
  ]

  try {
    const res = await fetch(`${process.env.EMERGENT_LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMERGENT_LLM_KEY}`,
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7 }),
    })
    const data = await res.json()
    if (!res.ok) return err(data?.error?.message || 'AI service error', 502)
    const reply = data?.choices?.[0]?.message?.content || 'Maaf, tidak dapat memberikan jawaban.'
    return json({ reply, sessionId: sessionId || uuidv4() })
  } catch (e) {
    return err('Gagal menghubungi AI: ' + (e.message || 'unknown'), 500)
  }
}

async function handle(request, params) {
  await ensureSeeded()
  const path = params?.path || []
  const method = request.method
  const route = path[0]

  if (!route) return json({ message: 'SekolahKu API up', version: '1.0' })

  // Public routes
  if (route === 'auth') return handleAuth(path, method, request)
  if (route === 'chat') return handleChat(path, method, request)

  // Protected routes
  const user = getAuthFromRequest(request)
  if (!user) return err('Unauthorized', 401)

  if (route === 'stats') return handleStats()
  if (route === 'siswa') return crud('siswa', path, method, request)
  if (route === 'guru') return crud('guru', path, method, request)
  if (route === 'kelas') return crud('kelas', path, method, request)
  if (route === 'pembayaran') return handlePembayaran(path, method, request)
  if (route === 'absensi') return crud('absensi', path, method, request)
  if (route === 'surat-masuk') return crud('surat_masuk', path, method, request)
  if (route === 'surat-keluar') return crud('surat_keluar', path, method, request)
  if (route === 'notifikasi') {
    return json([
      { id: 1, judul: 'Pembayaran SPP Baru', deskripsi: 'Transaksi baru masuk', waktu: '5 menit lalu', tipe: 'success' },
      { id: 2, judul: 'Surat Masuk Baru', deskripsi: 'Surat dari Dinas Pendidikan', waktu: '1 jam lalu', tipe: 'info' },
      { id: 3, judul: 'Tunggakan SPP', deskripsi: 'Beberapa siswa belum membayar', waktu: '3 jam lalu', tipe: 'warning' },
    ])
  }
  if (route === 'settings') {
    const col = await getCollection('settings')
    if (method === 'GET') {
      const s = await col.findOne({}, { projection: { _id: 0 } })
      return json(s || {})
    }
    if (method === 'PUT') {
      const body = await readBody(request)
      delete body._id
      const existing = await col.findOne({})
      if (existing) await col.updateOne({ id: existing.id }, { $set: { ...body, updatedAt: new Date() } })
      else await col.insertOne({ id: uuidv4(), ...body, createdAt: new Date() })
      const s = await col.findOne({}, { projection: { _id: 0 } })
      return json(s)
    }
  }
  if (route === 'users') {
    if (!requireRole(user, [ROLES.ADMIN])) return err('Forbidden', 403)
    return crud('users', path, method, request)
  }

  return err('Not found', 404)
}

export async function GET(request, { params }) { return handle(request, params) }
export async function POST(request, { params }) { return handle(request, params) }
export async function PUT(request, { params }) { return handle(request, params) }
export async function DELETE(request, { params }) { return handle(request, params) }
export async function PATCH(request, { params }) { return handle(request, params) }
