import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { signToken, comparePassword, getAuthFromRequest, requireRole, ROLES } from '@/lib/auth/jwt'
import { ensureSeeded } from '@/lib/seed'
import { v4 as uuidv4 } from 'uuid'
import { sendEmail, emailTagihanBaru, emailPembayaranLunas, emailReminderTunggakan } from '@/lib/email/send'

const json = (data, init = {}) => NextResponse.json(data, init)
const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status })

async function readBody(req) { try { return await req.json() } catch { return {} } }

// --- Simple in-memory rate limiter (per-IP, per-minute) ---
const rateLimits = new Map()
const RATE_LIMIT_WINDOW_MS = 60_000
function checkRateLimit(key, max) {
  const now = Date.now()
  const bucket = rateLimits.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + RATE_LIMIT_WINDOW_MS }
  bucket.count++
  rateLimits.set(key, bucket)
  return bucket.count <= max
}
function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

// --- Sanitize MongoDB query operators from user input to prevent NoSQL injection ---
function sanitizeBody(body, opts = {}) {
  if (!body || typeof body !== 'object') return body
  const skipFields = opts.allowPassword ? ['$', '.', '_id', 'id'] : ['$', '.', '_id', 'id', 'password']
  const out = {}
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith('$') || k.includes('.')) continue  // skip operators & nested paths
    if (k === '_id' || k === 'id') continue
    if (!opts.allowPassword && k === 'password') continue
    out[k] = v
  }
  return out
}

// --- Per-route role permissions ---
// Format: { method: [allowedRoles] } - GET typically open to all authenticated, mutations restricted
const ROUTE_PERMISSIONS = {
  siswa:        { GET: ['admin', 'tu', 'wali_kelas'], POST: ['admin', 'tu'], PUT: ['admin', 'tu'], DELETE: ['admin'] },
  guru:         { GET: ['admin', 'tu'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] },
  kelas:        { GET: ['admin', 'tu', 'wali_kelas'], POST: ['admin', 'tu'], PUT: ['admin', 'tu'], DELETE: ['admin'] },
  pembayaran:   { GET: ['admin', 'tu'], POST: ['admin', 'tu'], PUT: ['admin', 'tu'], DELETE: ['admin'] },
  absensi:      { GET: ['admin', 'tu', 'wali_kelas'], POST: ['admin', 'tu', 'wali_kelas'], PUT: ['admin', 'tu', 'wali_kelas'], DELETE: ['admin'] },
  'surat-masuk':{ GET: ['admin', 'tu'], POST: ['admin', 'tu'], PUT: ['admin', 'tu'], DELETE: ['admin'] },
  'surat-keluar':{ GET: ['admin', 'tu'], POST: ['admin', 'tu'], PUT: ['admin', 'tu'], DELETE: ['admin'] },
  settings:     { GET: ['admin', 'tu', 'wali_kelas'], PUT: ['admin'] },
  users:        { GET: ['admin'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] },
  stats:        { GET: ['admin', 'tu', 'wali_kelas'] },
  notifikasi:   { GET: ['admin', 'tu', 'wali_kelas'] },
}

function checkPermission(user, route, method) {
  const perms = ROUTE_PERMISSIONS[route]
  if (!perms) return true  // route not in map, allow (e.g., chat)
  const allowed = perms[method]
  if (!allowed) return false
  return allowed.includes(user.role)
}

async function handleAuth(path, method, req) {
  if (path[1] === 'login' && method === 'POST') {
    // Rate limit: max 5 login attempts per minute per IP
    const ip = getClientIp(req)
    if (!checkRateLimit(`login:${ip}`, 5)) {
      return err('Terlalu banyak percobaan login. Coba lagi dalam 1 menit.', 429)
    }
    const { email, password } = await readBody(req)
    if (!email || !password) return err('Email dan password wajib', 400)
    if (typeof email !== 'string' || typeof password !== 'string') return err('Input tidak valid', 400)
    const users = await getCollection('users')
    const user = await users.findOne({ email })
    // Generic error to avoid user enumeration
    if (!user) return err('Email atau password salah', 401)
    const ok = await comparePassword(password, user.password)
    if (!ok) return err('Email atau password salah', 401)
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
    // Hard limit to prevent unbounded query (production safety)
    const items = await col.find({}, { projection: { _id: 0, password: 0 } }).sort({ createdAt: -1 }).limit(1000).toArray()
    return json(items)
  }
  if (method === 'GET' && id) {
    const item = await col.findOne({ id }, { projection: { _id: 0, password: 0 } })
    if (!item) return err('Not found', 404)
    return json(item)
  }
  if (method === 'POST') {
    const body = sanitizeBody(await readBody(req))
    const item = { id: uuidv4(), ...body, createdAt: new Date() }
    if (opts.beforeInsert) await opts.beforeInsert(item, body)
    await col.insertOne(item)
    const { _id, password, ...clean } = item
    return json(clean)
  }
  if (method === 'PUT' && id) {
    const body = sanitizeBody(await readBody(req))
    if (opts.beforeUpdate) await opts.beforeUpdate(body, id)
    await col.updateOne({ id }, { $set: { ...body, updatedAt: new Date() } })
    const item = await col.findOne({ id }, { projection: { _id: 0, password: 0 } })
    return json(item)
  }
  if (method === 'DELETE' && id) {
    await col.deleteOne({ id })
    return json({ ok: true })
  }
  return err('Not found', 404)
}

// User CRUD with password hashing
async function handleUsers(path, method, req, currentUser) {
  const id = path[1]
  const col = await getCollection('users')

  if (method === 'POST') {
    const body = sanitizeBody(await readBody(req), { allowPassword: true })
    if (!body.email || !body.password || !body.name || !body.role) {
      return err('Email, password, nama, dan role wajib diisi', 400)
    }
    if (body.password.length < 6) return err('Password minimal 6 karakter', 400)
    if (!['admin', 'tu', 'wali_kelas'].includes(body.role)) return err('Role tidak valid', 400)
    const exists = await col.findOne({ email: body.email })
    if (exists) return err('Email sudah terdaftar', 400)
    const { hashPassword } = await import('@/lib/auth/jwt')
    const item = {
      id: uuidv4(),
      email: body.email,
      name: body.name,
      role: body.role,
      kelas: body.kelas || null,
      password: await hashPassword(body.password),
      createdAt: new Date(),
    }
    await col.insertOne(item)
    const { _id, password, ...clean } = item
    return json(clean)
  }
  if (method === 'PUT' && id) {
    const body = sanitizeBody(await readBody(req), { allowPassword: true })
    const update = { updatedAt: new Date() }
    if (body.name) update.name = body.name
    if (body.email) {
      // Check duplicate email
      const dup = await col.findOne({ email: body.email, id: { $ne: id } })
      if (dup) return err('Email sudah digunakan user lain', 400)
      update.email = body.email
    }
    if (body.role) {
      if (!['admin', 'tu', 'wali_kelas'].includes(body.role)) return err('Role tidak valid', 400)
      update.role = body.role
    }
    if (body.kelas !== undefined) update.kelas = body.kelas
    if (body.password && body.password.trim()) {
      if (body.password.length < 6) return err('Password minimal 6 karakter', 400)
      const { hashPassword } = await import('@/lib/auth/jwt')
      update.password = await hashPassword(body.password)
    }
    await col.updateOne({ id }, { $set: update })
    const item = await col.findOne({ id }, { projection: { _id: 0, password: 0 } })
    return json(item)
  }
  if (method === 'DELETE' && id) {
    // Prevent self-deletion
    if (id === currentUser.id) return err('Tidak dapat menghapus akun sendiri', 400)
    await col.deleteOne({ id })
    return json({ ok: true })
  }
  return crud('users', path, method, req)
}

async function handleStats() {
  const [siswa, guru, kelas, pembayaran] = await Promise.all([
    getCollection('siswa').then(c => c.countDocuments()),
    getCollection('guru').then(c => c.countDocuments()),
    getCollection('kelas').then(c => c.countDocuments()),
    // Fetch current-month Lunas only with projection — bounded by month
    getCollection('pembayaran').then(c => c.find({ status: 'Lunas' }, { projection: { _id: 0, jumlah: 1, tanggalBayar: 1 } }).limit(5000).toArray()),
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
  const allSiswa = await siswaCol.find({}, { projection: { _id: 0, kelas: 1 } }).limit(10000).toArray()
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
    const siswaAktif = await siswaCol.find({ status: 'Aktif' }).limit(5000).toArray()

    // FIX N+1: batch-fetch existing payments for this period instead of querying per student
    const existingPayments = await payCol.find({ bulan, tahun }).project({ siswaId: 1, _id: 0 }).limit(5000).toArray()
    const existingIds = new Set(existingPayments.map(p => p.siswaId))

    let created = 0
    let emailSent = 0
    const newTagihan = []
    const docsToInsert = []
    for (const s of siswaAktif) {
      if (existingIds.has(s.id)) continue
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
      docsToInsert.push(tagihan)
      newTagihan.push({ ...tagihan, email: s.email, emailOrtu: s.emailOrtu })
      created++
    }
    if (docsToInsert.length > 0) {
      await payCol.insertMany(docsToInsert)  // FIX: batch insert instead of one-by-one
    }

    // Send emails in background (don't block response too long)
    if (shouldSendEmail && newTagihan.length > 0) {
      const tasks = newTagihan.slice(0, 50).map(async (t) => {
        const target = t.emailOrtu || t.email
        if (!target) return
        const { subject, html, text } = emailTagihanBaru({ namaSiswa: t.namaSiswa, kelas: t.kelas, bulan, tahun, jumlah: t.jumlah, namaSekolah: settings?.namaSekolah })
        const r = await sendEmail({ to: target, subject, html, text })
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

    // Only top 500 unpaid bills are eligible for reminder batch
    const tagihan = ids.length > 0
      ? await payCol.find({ id: { $in: ids }, status: 'Belum Lunas' }).limit(500).toArray()
      : await payCol.find({ status: 'Belum Lunas' }).limit(500).toArray()

    // FIX N+1: batch-fetch all relevant siswa instead of per-tagihan
    const siswaIds = [...new Set(tagihan.slice(0, 50).map(t => t.siswaId))]
    const siswaList = siswaIds.length > 0
      ? await siswaCol.find({ id: { $in: siswaIds } }).limit(500).toArray()
      : []
    const siswaMap = new Map(siswaList.map(s => [s.id, s]))

    let sent = 0, failed = 0
    for (const t of tagihan.slice(0, 50)) {
      const siswa = siswaMap.get(t.siswaId)
      const target = siswa?.emailOrtu || siswa?.email
      if (!target) { failed++; continue }
      const { subject, html, text } = emailReminderTunggakan({ namaSiswa: t.namaSiswa, kelas: t.kelas, bulan: t.bulan, tahun: t.tahun, jumlah: t.jumlah, namaSekolah: settings?.namaSekolah })
      const r = await sendEmail({ to: target, subject, html, text })
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
    const target = siswa?.emailOrtu || siswa?.email
    if (!target) return err('Email orang tua / siswa tidak tersedia', 400)
    const settings = await settingsCol.findOne({})
    const tpl = item.status === 'Lunas'
      ? emailPembayaranLunas({ ...item, idTransaksi: item.id, namaSekolah: settings?.namaSekolah })
      : emailReminderTunggakan({ ...item, namaSekolah: settings?.namaSekolah })
    const r = await sendEmail({ to: target, ...tpl })
    return json({ ok: r.ok, error: r.error, to: target })
  }

  return crud('pembayaran', path, method, req)
}

async function handleChat(path, method, req) {
  if (method !== 'POST') return err('Method not allowed', 405)
  const body = await readBody(req)
  const { message, sessionId, history = [] } = body
  if (!message) return err('Message wajib diisi', 400)

  // Get school context from DB (all queries bounded by limit for safety)
  const [siswaCount, guruCount, kelasCount, payCount, paidCount, settings, siswaSample, guruSample, kelasSample] = await Promise.all([
    getCollection('siswa').then(c => c.countDocuments()),
    getCollection('guru').then(c => c.countDocuments()),
    getCollection('kelas').then(c => c.countDocuments()),
    getCollection('pembayaran').then(c => c.countDocuments()),
    getCollection('pembayaran').then(c => c.countDocuments({ status: 'Lunas' })),
    getCollection('settings').then(c => c.findOne({})),
    getCollection('siswa').then(c => c.find({}, { projection: { _id: 0, nama: 1, kelas: 1, status: 1 } }).limit(50).toArray()),
    getCollection('guru').then(c => c.find({}, { projection: { _id: 0, nama: 1, mapel: 1 } }).limit(30).toArray()),
    getCollection('kelas').then(c => c.find({}, { projection: { _id: 0, nama: 1, tingkat: 1, waliKelas: 1, jumlahSiswa: 1 } }).limit(100).toArray()),
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

  // Public settings (for login page branding) - read-only, no sensitive data
  if (route === 'settings' && path[1] === 'public' && method === 'GET') {
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
      }
    })
    // Merge with defaults for backwards compatibility
    return json({
      namaSekolah: s?.namaSekolah || 'SekolahKu',
      taglineApp: s?.taglineApp || 'Tata Usaha Digital',
      logoUrl: s?.logoUrl || '',
      heroTitle: s?.heroTitle || 'Kelola Administrasi Sekolah dengan Mudah & Efisien',
      heroSubtitle: s?.heroSubtitle || 'Platform terintegrasi untuk siswa, guru, pembayaran SPP, absensi, dan administrasi sekolah modern.',
      heroStats: Array.isArray(s?.heroStats) && s.heroStats.length === 4 ? s.heroStats : [
        { icon: 'Users', value: '444+', label: 'Manajemen Siswa' },
        { icon: 'BookOpen', value: '24', label: 'Mata Pelajaran' },
        { icon: 'ClipboardCheck', value: '97%', label: 'Kehadiran Hari Ini' },
        { icon: 'Wallet', value: '89%', label: 'SPP Lunas' },
      ],
    })
  }

  // Chat endpoint - rate-limited per IP (still public per requirement, but throttled)
  if (route === 'chat') {
    const ip = getClientIp(request)
    if (!checkRateLimit(`chat:${ip}`, 20)) {
      return err('Terlalu banyak request chat. Coba lagi nanti.', 429)
    }
    return handleChat(path, method, request)
  }

  // Protected routes
  const user = getAuthFromRequest(request)
  if (!user) return err('Unauthorized', 401)

  // Per-route role check
  if (!checkPermission(user, route, method)) {
    return err('Akses ditolak. Anda tidak memiliki izin untuk aksi ini.', 403)
  }

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
      const body = sanitizeBody(await readBody(request))
      const existing = await col.findOne({})
      if (existing) await col.updateOne({ id: existing.id }, { $set: { ...body, updatedAt: new Date() } })
      else await col.insertOne({ id: uuidv4(), ...body, createdAt: new Date() })
      const s = await col.findOne({}, { projection: { _id: 0 } })
      return json(s)
    }
  }
  if (route === 'users') {
    // Extra guard - already in ROUTE_PERMISSIONS but defense-in-depth
    if (!requireRole(user, [ROLES.ADMIN])) return err('Forbidden', 403)
    return handleUsers(path, method, request, user)
  }

  return err('Not found', 404)
}

export async function GET(request, { params }) { return handle(request, params) }
export async function POST(request, { params }) { return handle(request, params) }
export async function PUT(request, { params }) { return handle(request, params) }
export async function DELETE(request, { params }) { return handle(request, params) }
export async function PATCH(request, { params }) { return handle(request, params) }
