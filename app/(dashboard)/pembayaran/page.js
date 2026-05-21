'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCrud } from '@/lib/hooks/use-crud'
import { apiClient } from '@/lib/api/client'
import { TableSkeleton, EmptyState } from '@/components/table-helpers'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Search, Printer, Eye, Wallet, CheckCircle2, XCircle, GraduationCap, Plus, Sparkles, Loader2, MoreHorizontal, DollarSign, Trash2, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { toast } from 'sonner'

const formatIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0)
const BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const paySchema = z.object({
  siswaId: z.string().min(1, 'Siswa wajib dipilih'),
  bulan: z.string().min(1, 'Bulan wajib dipilih'),
  tahun: z.coerce.number().min(2020).max(2050),
  jumlah: z.coerce.number().min(1000, 'Minimal Rp 1.000'),
  metode: z.string().min(1, 'Metode wajib dipilih'),
  status: z.string().optional(),
  catatan: z.string().optional(),
})

export default function PembayaranPage() {
  const { data, loading, create, refetch, remove } = useCrud('pembayaran')
  const [siswaList, setSiswaList] = useState([])
  const [settings, setSettings] = useState({ sppSMP: 400000, sppSMA: 600000 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [openGenerate, setOpenGenerate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(BULAN_LIST[new Date().getMonth()])
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    Promise.all([
      apiClient.get('/siswa').then(r => r.data),
      apiClient.get('/settings').then(r => r.data),
    ]).then(([s, st]) => { setSiswaList(s || []); setSettings({ sppSMP: st?.sppSMP || 400000, sppSMA: st?.sppSMA || 600000 }) }).catch(() => {})
  }, [])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(paySchema),
    defaultValues: { siswaId: '', bulan: BULAN_LIST[new Date().getMonth()], tahun: new Date().getFullYear(), jumlah: settings.sppSMP, metode: 'Tunai', status: 'Lunas', catatan: '' },
  })

  const watchedSiswa = watch('siswaId')
  useEffect(() => {
    if (watchedSiswa) {
      const s = siswaList.find(x => x.id === watchedSiswa)
      if (s) {
        const isSMP = ['7','8','9'].some(k => s.kelas?.startsWith(k))
        setValue('jumlah', isSMP ? settings.sppSMP : settings.sppSMA)
      }
    }
  }, [watchedSiswa, siswaList, settings, setValue])

  const filtered = data.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.namaSiswa?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalLunas = data.filter(p => p.status === 'Lunas').reduce((sum, p) => sum + (p.jumlah || 0), 0)
  const totalBelumLunas = data.filter(p => p.status !== 'Lunas').reduce((sum, p) => sum + (p.jumlah || 0), 0)

  const openCreate = () => {
    reset({ siswaId: '', bulan: BULAN_LIST[new Date().getMonth()], tahun: new Date().getFullYear(), jumlah: settings.sppSMP, metode: 'Tunai', status: 'Lunas', catatan: '' })
    setOpenForm(true)
  }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const siswa = siswaList.find(s => s.id === values.siswaId)
      const payload = {
        ...values,
        namaSiswa: siswa?.nama,
        kelas: siswa?.kelas,
        tanggalBayar: values.status === 'Lunas' ? new Date().toISOString().slice(0,10) : null,
      }
      await create(payload)
      setOpenForm(false)
    } finally { setSubmitting(false) }
  }

  const handleMarkLunas = async (id, metode = 'Tunai') => {
    try {
      await apiClient.post(`/pembayaran/${id}/lunas`, { metode })
      toast.success('Pembayaran ditandai sebagai Lunas')
      refetch()
    } catch (e) { toast.error('Gagal update status') }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await apiClient.post('/pembayaran/generate-tagihan', { bulan: genMonth, tahun: genYear })
      toast.success(res.data.message || 'Tagihan berhasil dibuat')
      setOpenGenerate(false)
      refetch()
    } catch (e) {
      toast.error('Gagal generate tagihan')
    } finally { setGenerating(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pembayaran SPP</h1>
          <p className="text-sm text-muted-foreground">Kelola pembayaran SPP siswa</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToExcel(filtered.map(p => ({ ID: p.id?.slice(0,8), 'Nama Siswa': p.namaSiswa, Kelas: p.kelas, Bulan: p.bulan, Tahun: p.tahun, Jumlah: p.jumlah, Metode: p.metode, 'Tgl Bayar': p.tanggalBayar, Status: p.status })), `pembayaran-spp-${new Date().toISOString().slice(0,10)}`, 'Pembayaran SPP')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF({ title: 'Laporan Pembayaran SPP', subtitle: `${filtered.length} transaksi - Total Lunas: ${formatIDR(totalLunas)}, Tunggakan: ${formatIDR(totalBelumLunas)}`, columns: ['ID','Siswa','Kelas','Periode','Jumlah','Metode','Tgl Bayar','Status'], rows: filtered.map(p => [p.id?.slice(0,8), p.namaSiswa, p.kelas, `${p.bulan} ${p.tahun}`, formatIDR(p.jumlah), p.metode || '-', p.tanggalBayar || '-', p.status]), filename: `pembayaran-spp-${new Date().toISOString().slice(0,10)}`, orientation: 'landscape' })}>
                <FileText className="h-4 w-4 mr-2 text-red-600" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setOpenGenerate(true)}><Sparkles className="h-4 w-4 mr-2" /> Generate Tagihan</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Catat Pembayaran</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Pemasukan</p><p className="text-2xl font-bold">{formatIDR(totalLunas)}</p></div><div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center"><Wallet className="h-5 w-5" /></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Tunggakan</p><p className="text-2xl font-bold text-amber-600">{formatIDR(totalBelumLunas)}</p></div><div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center"><XCircle className="h-5 w-5" /></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Transaksi Lunas</p><p className="text-2xl font-bold">{data.filter(p => p.status === 'Lunas').length} <span className="text-sm text-muted-foreground font-normal">/ {data.length}</span></p></div><div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari siswa atau ID transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
                <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? <TableSkeleton cols={8} /> : filtered.length === 0 ? (
            <EmptyState icon={Wallet} title="Belum ada pembayaran" description="Catat pembayaran pertama atau generate tagihan bulanan" action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Catat Pembayaran</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Periode</TableHead><TableHead>Jumlah</TableHead><TableHead>Tgl Bayar</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id?.slice(0, 8)}</TableCell>
                    <TableCell><p className="font-medium text-sm">{p.namaSiswa}</p></TableCell>
                    <TableCell><Badge variant="outline">{p.kelas}</Badge></TableCell>
                    <TableCell className="text-sm">{p.bulan} {p.tahun}</TableCell>
                    <TableCell className="font-semibold text-sm">{formatIDR(p.jumlah)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.tanggalBayar || '—'}</TableCell>
                    <TableCell>
                      {p.status === 'Lunas'
                        ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 gap-1"><CheckCircle2 className="h-3 w-3" /> Lunas</Badge>
                        : <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 gap-1"><XCircle className="h-3 w-3" /> Belum Lunas</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(p)}><Eye className="h-4 w-4 mr-2" /> Detail</DropdownMenuItem>
                          {p.status !== 'Lunas' && <DropdownMenuItem onClick={() => handleMarkLunas(p.id, 'Tunai')}><DollarSign className="h-4 w-4 mr-2 text-emerald-600" /> Tandai Lunas (Tunai)</DropdownMenuItem>}
                          {p.status !== 'Lunas' && <DropdownMenuItem onClick={() => handleMarkLunas(p.id, 'Transfer')}><DollarSign className="h-4 w-4 mr-2 text-emerald-600" /> Tandai Lunas (Transfer)</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => setSelected(p)}><Printer className="h-4 w-4 mr-2" /> Cetak Kwitansi</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Pembayaran */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran SPP</DialogTitle>
            <DialogDescription>Input pembayaran SPP siswa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5"><Label>Siswa</Label>
              <Select value={watch('siswaId')} onValueChange={(v) => setValue('siswaId', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent className="max-h-80">{siswaList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.kelas}</SelectItem>)}</SelectContent>
              </Select>
              {errors.siswaId && <p className="text-xs text-destructive">{errors.siswaId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Bulan</Label>
                <Select value={watch('bulan')} onValueChange={(v) => setValue('bulan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BULAN_LIST.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Tahun</Label><Input type="number" {...register('tahun')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Jumlah (Rp)</Label><Input type="number" {...register('jumlah')} />{errors.jumlah && <p className="text-xs text-destructive">{errors.jumlah.message}</p>}<p className="text-xs text-muted-foreground">Otomatis terisi berdasarkan jenjang siswa (SMP: {formatIDR(settings.sppSMP)}, SMA: {formatIDR(settings.sppSMA)})</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Metode Bayar</Label>
                <Select value={watch('metode')} onValueChange={(v) => setValue('metode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Tunai">Tunai</SelectItem><SelectItem value="Transfer">Transfer Bank</SelectItem><SelectItem value="QRIS">QRIS</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Lunas">Lunas</SelectItem><SelectItem value="Belum Lunas">Belum Lunas</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Catatan (opsional)</Label><Input {...register('catatan')} placeholder="Catatan tambahan" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Tagihan */}
      <Dialog open={openGenerate} onOpenChange={setOpenGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Generate Tagihan SPP</DialogTitle>
            <DialogDescription>Buat tagihan SPP untuk semua siswa aktif sekaligus</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Bulan</Label>
                <Select value={genMonth} onValueChange={setGenMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BULAN_LIST.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Tahun</Label><Input type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} /></div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-medium text-sm">Tarif SPP saat ini:</p>
              <p>• SMP: {formatIDR(settings.sppSMP)}/bulan</p>
              <p>• SMA: {formatIDR(settings.sppSMA)}/bulan</p>
              <p className="text-muted-foreground mt-2">Sistem akan otomatis melewati siswa yang sudah memiliki tagihan untuk periode ini.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGenerate(false)}>Batal</Button>
            <Button onClick={handleGenerate} disabled={generating}>{generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} <Sparkles className="h-4 w-4 mr-2" /> Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Print */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detail Pembayaran</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 print:p-6" id="receipt">
              <div className="text-center pb-4 border-b">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2"><GraduationCap className="h-6 w-6" /></div>
                <h2 className="font-bold">SekolahKu</h2>
                <p className="text-xs text-muted-foreground">Bukti Pembayaran SPP</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">ID Transaksi</span><span className="font-mono text-xs">{selected.id?.slice(0,12)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nama Siswa</span><span className="font-medium">{selected.namaSiswa}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kelas</span><span>{selected.kelas}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Periode</span><span>{selected.bulan} {selected.tahun}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span>{selected.metode || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{selected.tanggalBayar || '—'}</span></div>
                <div className="flex justify-between pt-3 border-t mt-2"><span className="font-medium">Total</span><span className="font-bold text-lg">{formatIDR(selected.jumlah)}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span>{selected.status === 'Lunas' ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Lunas</Badge> : <Badge variant="secondary">Belum Lunas</Badge>}</div>
              </div>
              <DialogFooter className="print:hidden">
                <Button variant="outline" onClick={() => setSelected(null)}>Tutup</Button>
                <Button onClick={() => { window.print(); toast.success('Mencetak struk...') }}><Printer className="h-4 w-4 mr-2" /> Cetak Struk</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus tagihan ini?</AlertDialogTitle><AlertDialogDescription>Data tidak dapat dikembalikan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await remove(deleteId); setDeleteId(null) }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
