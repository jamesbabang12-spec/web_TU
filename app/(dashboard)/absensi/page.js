'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ABSENSI_DATA, KELAS_LIST } from '@/lib/mock-data'
import { apiClient } from '@/lib/api/client'
import { CalendarCheck, Save, ScanLine, ListChecks, CheckCircle2, XCircle, Volume2, VolumeX, Trash2, UserCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Lazy-load barcode scanner (uses html5-qrcode which is heavy ~200KB)
const BarcodeScanner = dynamic(
  () => import('@/components/barcode-scanner').then(m => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square max-w-sm mx-auto bg-muted rounded-xl flex items-center justify-center border-2 border-dashed">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Memuat scanner kamera...</p>
        </div>
      </div>
    ),
  }
)

const STATUS_LIST = ['Hadir', 'Izin', 'Sakit', 'Alpa']
const STATUS_STYLE = {
  Hadir: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  Izin: 'bg-blue-600 hover:bg-blue-700 text-white',
  Sakit: 'bg-amber-600 hover:bg-amber-700 text-white',
  Alpa: 'bg-red-600 hover:bg-red-700 text-white',
}

export default function AbsensiPage() {
  const [date, setDate] = useState(new Date())
  const [kelas, setKelas] = useState(KELAS_LIST[0])
  const [siswaKelas, setSiswaKelas] = useState([])
  const [absensi, setAbsensi] = useState({})
  const [scanned, setScanned] = useState([]) // {nis, nama, kelas, time}
  const [soundOn, setSoundOn] = useState(true)
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [mode, setMode] = useState('manual')
  const audioRef = useRef(null)

  // Load siswa per kelas
  useEffect(() => {
    setLoadingSiswa(true)
    apiClient.get('/siswa').then(r => {
      const list = (r.data || []).filter(s => s.kelas === kelas)
      setSiswaKelas(list)
    }).catch(() => {}).finally(() => setLoadingSiswa(false))
  }, [kelas])

  const setStatus = (siswaId, status) => setAbsensi(prev => ({ ...prev, [siswaId]: status }))

  const playBeep = (success = true) => {
    if (!soundOn || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = success ? 880 : 220
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(); osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }

  const handleScan = (code) => {
    // Code = NIS atau ID siswa
    const cleanCode = (code || '').trim()
    const siswa = siswaKelas.find(s => s.nis === cleanCode || s.id === cleanCode)

    if (!siswa) {
      // Cek apakah siswa ada di kelas lain
      apiClient.get('/siswa').then(r => {
        const found = (r.data || []).find(s => s.nis === cleanCode || s.id === cleanCode)
        if (found) {
          playBeep(false)
          toast.error(`${found.nama} terdaftar di kelas ${found.kelas}, bukan ${kelas}`)
        } else {
          playBeep(false)
          toast.error(`Barcode tidak dikenali: ${cleanCode}`)
        }
      })
      return
    }

    // Cek apakah sudah di-scan
    if (absensi[siswa.id] === 'Hadir') {
      playBeep(false)
      toast.warning(`${siswa.nama} sudah di-scan sebelumnya`, { duration: 2000 })
      return
    }

    setStatus(siswa.id, 'Hadir')
    setScanned(prev => [{ nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, time: new Date() }, ...prev])
    playBeep(true)
    toast.success(`✓ ${siswa.nama} - Hadir`, { duration: 1500 })
  }

  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    const count = Object.keys(absensi).length
    if (count === 0) {
      toast.error('Belum ada siswa yang diabsen')
      return
    }
    setSaving(true)
    try {
      const tanggal = date.toISOString().slice(0, 10) // YYYY-MM-DD
      const items = Object.entries(absensi).map(([siswaId, status]) => {
        const s = siswaKelas.find(x => x.id === siswaId)
        return {
          siswaId,
          nis: s?.nis || '',
          nama: s?.nama || '',
          status,
        }
      })
      const payload = {
        tanggal,
        kelas,
        items,
        totalHadir: items.filter(i => i.status === 'Hadir').length,
        totalIzin: items.filter(i => i.status === 'Izin').length,
        totalSakit: items.filter(i => i.status === 'Sakit').length,
        totalAlpa: items.filter(i => i.status === 'Alpa').length,
        sumberInput: mode === 'barcode' ? 'scan' : 'manual',
      }
      await apiClient.post('/absensi', payload)
      toast.success(`✓ Absensi ${kelas} (${count} siswa) tanggal ${date.toLocaleDateString('id-ID')} tersimpan`)
    } catch (e) {
      toast.error(`Gagal menyimpan absensi: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const tandaiSemuaHadir = () => {
    const all = {}
    siswaKelas.forEach(s => { all[s.id] = 'Hadir' })
    setAbsensi(all)
    toast.info('Semua siswa ditandai Hadir')
  }

  const resetAbsensi = () => {
    setAbsensi({})
    setScanned([])
    toast.info('Absensi di-reset')
  }

  const summary = {
    hadir: Object.values(absensi).filter(v => v === 'Hadir').length,
    izin: Object.values(absensi).filter(v => v === 'Izin').length,
    sakit: Object.values(absensi).filter(v => v === 'Sakit').length,
    alpa: Object.values(absensi).filter(v => v === 'Alpa').length,
    belum: siswaKelas.length - Object.keys(absensi).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Absensi Siswa</h1>
          <p className="text-sm text-muted-foreground">Catat kehadiran siswa secara manual atau scan QR / Barcode</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={resetAbsensi}><Trash2 className="h-4 w-4 mr-2" /> Reset</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Siswa</p><p className="text-2xl font-bold">{siswaKelas.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-emerald-600">Hadir</p><p className="text-2xl font-bold text-emerald-600">{summary.hadir}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-blue-600">Izin</p><p className="text-2xl font-bold text-blue-600">{summary.izin}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-amber-600">Sakit</p><p className="text-2xl font-bold text-amber-600">{summary.sakit}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-red-600">Alpa / Belum</p><p className="text-2xl font-bold text-red-600">{summary.alpa + summary.belum}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Date + Kelas + Calendar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Periode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pilih Kelas</label>
              <Select value={kelas} onValueChange={setKelas}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KELAS_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tanggal</label>
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border" />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs">
              <p className="font-medium mb-1">{date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-muted-foreground">Kelas {kelas} • {siswaKelas.length} siswa terdaftar</p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Mode Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="gap-2"><ListChecks className="h-4 w-4" /> Manual</TabsTrigger>
                <TabsTrigger value="barcode" className="gap-2"><ScanLine className="h-4 w-4" /> Scan QR / Barcode</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {mode === 'manual' ? (
              <ManualMode siswaKelas={siswaKelas} loading={loadingSiswa} absensi={absensi} setStatus={setStatus} onAllHadir={tandaiSemuaHadir} />
            ) : (
              <BarcodeMode
                siswaKelas={siswaKelas}
                absensi={absensi}
                scanned={scanned}
                setStatus={setStatus}
                onScan={handleScan}
                kelas={kelas}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Rekap Absensi Bulan Ini</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Hadir</TableHead>
                <TableHead className="text-center">Izin</TableHead>
                <TableHead className="text-center">Sakit</TableHead>
                <TableHead className="text-center">Alpa</TableHead>
                <TableHead>Persentase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ABSENSI_DATA.map((a) => {
                const total = a.hadir + a.izin + a.sakit + a.alpa
                const pct = Math.round((a.hadir / total) * 100)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nama}</TableCell>
                    <TableCell><Badge variant="outline">{a.kelas}</Badge></TableCell>
                    <TableCell className="text-center text-emerald-600 font-medium">{a.hadir}</TableCell>
                    <TableCell className="text-center text-blue-600">{a.izin}</TableCell>
                    <TableCell className="text-center text-amber-600">{a.sakit}</TableCell>
                    <TableCell className="text-center text-red-600">{a.alpa}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs font-medium w-9">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ManualMode({ siswaKelas, loading, absensi, setStatus, onAllHadir }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Klik status untuk setiap siswa</p>
        <Button variant="outline" size="sm" onClick={onAllHadir}><UserCheck className="h-4 w-4 mr-2" /> Tandai Semua Hadir</Button>
      </div>
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : siswaKelas.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Tidak ada siswa di kelas ini</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {siswaKelas.map((s) => {
            const initials = (s.nama || '').split(' ').map(x => x[0]).slice(0, 2).join('')
            const current = absensi[s.id]
            return (
              <div key={s.id} className={cn('flex items-center gap-3 p-3 rounded-lg border transition-colors', current === 'Hadir' && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900')}>
                <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">{s.nis}</p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {STATUS_LIST.map(st => (
                    <Button key={st} size="sm" variant={current === st ? 'default' : 'outline'} onClick={() => setStatus(s.id, st)} className={current === st ? STATUS_STYLE[st] : ''}>{st}</Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BarcodeMode({ siswaKelas, absensi, scanned, setStatus, onScan, kelas }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><ScanLine className="h-4 w-4" /> Scanner Kamera</h4>
        <BarcodeScanner onScan={onScan} />
        <div className="mt-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/30 p-3 text-xs space-y-1">
          <p className="font-medium">💡 Tips:</p>
          <p>• QR Code di kartu siswa berisi NIS siswa</p>
          <p>• Beri jarak ~15-30 cm antara kartu & kamera</p>
          <p>• Cetak kartu QR siswa dari menu Data Siswa</p>
          <p>• Bisa scan dengan HP melalui browser</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Siswa Tercatat ({scanned.length})
          </h4>
          <Badge variant="secondary" className="text-xs">{kelas}</Badge>
        </div>
        {scanned.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-2">
            <ScanLine className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada siswa yang di-scan</p>
            <p className="text-xs text-muted-foreground">Mulai scan QR/Barcode di sebelah kiri</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {scanned.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/30 animate-in slide-in-from-top duration-300">
                <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">NIS: {s.nis} • {new Date(s.time).toLocaleTimeString('id-ID')}</p>
                </div>
                <Badge className="bg-emerald-600">Hadir</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Belum hadir ({siswaKelas.length - scanned.length} siswa):</p>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {siswaKelas.filter(s => absensi[s.id] !== 'Hadir').slice(0, 20).map(s => (
              <Badge key={s.id} variant="outline" className="text-[10px]">{s.nama.split(' ')[0]}</Badge>
            ))}
            {siswaKelas.filter(s => absensi[s.id] !== 'Hadir').length > 20 && (
              <Badge variant="outline" className="text-[10px]">+{siswaKelas.filter(s => absensi[s.id] !== 'Hadir').length - 20} lainnya</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
