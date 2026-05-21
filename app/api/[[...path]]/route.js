import { NextResponse } from 'next/server'
import { SISWA_DATA, GURU_DATA, KELAS_DATA, PEMBAYARAN_DATA, ABSENSI_DATA, SURAT_MASUK, SURAT_KELUAR, NOTIFIKASI, PEMASUKAN_CHART, ABSENSI_CHART, KELAS_DISTRIBUSI } from '@/lib/mock-data'

const MAP = {
  siswa: SISWA_DATA,
  guru: GURU_DATA,
  kelas: KELAS_DATA,
  pembayaran: PEMBAYARAN_DATA,
  absensi: ABSENSI_DATA,
  'surat-masuk': SURAT_MASUK,
  'surat-keluar': SURAT_KELUAR,
  notifikasi: NOTIFIKASI,
}

export async function GET(request, { params }) {
  const path = params?.path || []
  const route = path[0]
  if (!route) return NextResponse.json({ message: 'SekolahKu API up' })
  if (route === 'stats') {
    return NextResponse.json({
      totalSiswa: SISWA_DATA.length,
      totalGuru: GURU_DATA.length,
      totalKelas: KELAS_DATA.length,
      pembayaranHariIni: 12750000,
      pemasukanChart: PEMASUKAN_CHART,
      absensiChart: ABSENSI_CHART,
      kelasDistribusi: KELAS_DISTRIBUSI,
    })
  }
  if (MAP[route]) return NextResponse.json(MAP[route])
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request, { params }) {
  const path = params?.path || []
  const route = path[0]
  const body = await request.json().catch(() => ({}))
  if (route === 'auth' && path[1] === 'login') {
    return NextResponse.json({ token: 'mock-jwt-token-' + Date.now(), user: { email: body.email, name: 'Pak Admin', role: 'Administrator' } })
  }
  return NextResponse.json({ ok: true, data: body, id: 'NEW-' + Date.now() })
}

export async function PUT(request, { params }) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, data: body })
}

export async function DELETE(request, { params }) {
  return NextResponse.json({ ok: true })
}
