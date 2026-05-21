'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PEMBAYARAN_DATA } from '@/lib/mock-data'
import { Search, Printer, Eye, Wallet, CheckCircle2, XCircle, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

const formatIDR = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

export default function PembayaranPage() {
  const [data] = useState(PEMBAYARAN_DATA)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = data.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.namaSiswa.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalLunas = data.filter(p => p.status === 'Lunas').reduce((sum, p) => sum + p.jumlah, 0)
  const totalBelumLunas = data.filter(p => p.status !== 'Lunas').reduce((sum, p) => sum + p.jumlah, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran SPP</h1>
        <p className="text-sm text-muted-foreground">Kelola pembayaran SPP siswa</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell><p className="font-medium text-sm">{p.namaSiswa}</p></TableCell>
                  <TableCell><Badge variant="outline">{p.kelas}</Badge></TableCell>
                  <TableCell className="text-sm">{p.bulan} {p.tahun}</TableCell>
                  <TableCell className="font-semibold text-sm">{formatIDR(p.jumlah)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.tanggalBayar || '—'}</TableCell>
                  <TableCell>
                    {p.status === 'Lunas' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 gap-1"><CheckCircle2 className="h-3 w-3" /> Lunas</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 gap-1"><XCircle className="h-3 w-3" /> Belum Lunas</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(p)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(p); setTimeout(() => window.print(), 100) }}><Printer className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 print:p-6">
              <div className="text-center pb-4 border-b">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2"><GraduationCap className="h-6 w-6" /></div>
                <h2 className="font-bold">SekolahKu</h2>
                <p className="text-xs text-muted-foreground">Bukti Pembayaran SPP</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">ID Transaksi</span><span className="font-mono">{selected.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nama Siswa</span><span className="font-medium">{selected.namaSiswa}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kelas</span><span>{selected.kelas}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Periode</span><span>{selected.bulan} {selected.tahun}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span>{selected.metode}</span></div>
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
    </div>
  )
}
