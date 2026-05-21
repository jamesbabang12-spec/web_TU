import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'SekolahKu <onboarding@resend.dev>'

const formatIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0)

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email')
    return { ok: false, error: 'Email service not configured' }
  }
  try {
    const res = await resend.emails.send({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, text })
    if (res.error) return { ok: false, error: res.error.message || 'Send failed' }
    return { ok: true, id: res.data?.id }
  } catch (e) {
    console.error('Email error:', e)
    return { ok: false, error: e.message || 'Send failed' }
  }
}

const layout = (content) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f4f5; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#4f46e5 0%, #2563eb 50%, #06b6d4 100%); padding:24px; color:#fff;">
      <h1 style="margin:0; font-size:20px; font-weight:700;">🎓 SekolahKu</h1>
      <p style="margin:4px 0 0; opacity:0.9; font-size:13px;">Sistem Tata Usaha Sekolah</p>
    </div>
    <div style="padding:24px; color:#1f2937; line-height:1.6;">${content}</div>
    <div style="padding:16px 24px; background:#f9fafb; color:#6b7280; font-size:11px; border-top:1px solid #e5e7eb;">
      Email otomatis dari SekolahKu. Mohon tidak membalas email ini.
    </div>
  </div>
</body></html>`

export function emailTagihanBaru({ namaSiswa, kelas, bulan, tahun, jumlah, namaSekolah }) {
  return {
    subject: `[SekolahKu] Tagihan SPP ${bulan} ${tahun} — ${namaSiswa}`,
    html: layout(`
      <h2 style="margin-top:0; font-size:18px;">Tagihan SPP Baru</h2>
      <p>Yth. Orang Tua/Wali Siswa <strong>${namaSiswa}</strong>,</p>
      <p>Kami informasikan tagihan SPP untuk periode <strong>${bulan} ${tahun}</strong> telah diterbitkan:</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Nama Siswa</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-weight:600;">${namaSiswa}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Kelas</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-weight:600;">${kelas}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Periode</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-weight:600;">${bulan} ${tahun}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:12px; background:#dbeafe; color:#1e40af; border-radius:6px 0 0 6px;"><strong>Total Tagihan</strong></td><td style="padding:12px; background:#dbeafe; color:#1e40af; text-align:right; border-radius:0 6px 6px 0; font-weight:700; font-size:18px;">${formatIDR(jumlah)}</td></tr>
      </table>
      <p>Mohon dapat segera melakukan pembayaran melalui Tata Usaha sekolah.</p>
      <p style="margin-top:24px;">Terima kasih,<br/><strong>${namaSekolah || 'SekolahKu'}</strong></p>
    `),
    text: `Tagihan SPP ${bulan} ${tahun} untuk ${namaSiswa} (${kelas}) sebesar ${formatIDR(jumlah)}. Mohon segera dilunasi.`,
  }
}

export function emailPembayaranLunas({ namaSiswa, kelas, bulan, tahun, jumlah, tanggalBayar, metode, namaSekolah, idTransaksi }) {
  return {
    subject: `[SekolahKu] Konfirmasi Pembayaran SPP ${bulan} ${tahun} — ${namaSiswa}`,
    html: layout(`
      <div style="text-align:center; margin-bottom:16px;">
        <div style="display:inline-block; width:64px; height:64px; background:#d1fae5; border-radius:50%; line-height:64px; text-align:center; font-size:32px;">✅</div>
      </div>
      <h2 style="margin-top:0; text-align:center; font-size:18px;">Pembayaran Berhasil Diterima</h2>
      <p>Yth. Orang Tua/Wali Siswa <strong>${namaSiswa}</strong>,</p>
      <p>Terima kasih, pembayaran SPP <strong>${bulan} ${tahun}</strong> telah kami terima dengan rincian berikut:</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">ID Transaksi</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-family:monospace; font-size:12px;">${(idTransaksi || '').slice(0,12)}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Siswa</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-weight:600;">${namaSiswa} (${kelas})</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Periode</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0; font-weight:600;">${bulan} ${tahun}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Tanggal Bayar</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0;">${tanggalBayar}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#f3f4f6; border-radius:6px 0 0 6px;">Metode</td><td style="padding:8px; background:#f3f4f6; text-align:right; border-radius:0 6px 6px 0;">${metode || '-'}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:12px; background:#d1fae5; color:#065f46; border-radius:6px 0 0 6px;"><strong>Total Dibayar</strong></td><td style="padding:12px; background:#d1fae5; color:#065f46; text-align:right; border-radius:0 6px 6px 0; font-weight:700; font-size:18px;">${formatIDR(jumlah)}</td></tr>
      </table>
      <p>Email ini berlaku sebagai bukti pembayaran resmi. Simpan sebagai arsip.</p>
      <p style="margin-top:24px;">Hormat kami,<br/><strong>${namaSekolah || 'SekolahKu'}</strong></p>
    `),
    text: `Pembayaran SPP ${bulan} ${tahun} untuk ${namaSiswa} sebesar ${formatIDR(jumlah)} telah diterima pada ${tanggalBayar}. Terima kasih.`,
  }
}

export function emailReminderTunggakan({ namaSiswa, kelas, bulan, tahun, jumlah, namaSekolah }) {
  return {
    subject: `[SekolahKu] ⚠️ Reminder Tunggakan SPP — ${namaSiswa}`,
    html: layout(`
      <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; margin-bottom:16px; border-radius:6px;">
        <strong style="color:#92400e;">⚠️ Reminder Pembayaran</strong>
      </div>
      <p>Yth. Orang Tua/Wali Siswa <strong>${namaSiswa}</strong>,</p>
      <p>Kami informasikan bahwa tagihan SPP berikut belum kami terima pembayarannya:</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:8px; background:#fef3c7;">Nama Siswa</td><td style="padding:8px; background:#fef3c7; text-align:right; font-weight:600;">${namaSiswa} (${kelas})</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:8px; background:#fef3c7;">Periode</td><td style="padding:8px; background:#fef3c7; text-align:right; font-weight:600;">${bulan} ${tahun}</td></tr>
        <tr><td colspan="2" style="height:4px;"></td></tr>
        <tr><td style="padding:12px; background:#fed7aa; color:#9a3412; border-radius:6px 0 0 6px;"><strong>Total Tunggakan</strong></td><td style="padding:12px; background:#fed7aa; color:#9a3412; text-align:right; border-radius:0 6px 6px 0; font-weight:700; font-size:18px;">${formatIDR(jumlah)}</td></tr>
      </table>
      <p>Mohon kerjasamanya untuk segera menyelesaikan pembayaran agar proses administrasi siswa tetap lancar.</p>
      <p>Apabila sudah melakukan pembayaran, mohon abaikan email ini dan informasikan ke Tata Usaha.</p>
      <p style="margin-top:24px;">Terima kasih,<br/><strong>${namaSekolah || 'SekolahKu'}</strong></p>
    `),
    text: `Reminder: SPP ${bulan} ${tahun} untuk ${namaSiswa} sebesar ${formatIDR(jumlah)} belum dibayar. Mohon segera diselesaikan.`,
  }
}
