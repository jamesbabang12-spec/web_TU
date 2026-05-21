'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Download, Users } from 'lucide-react'
import { SISWA_DATA, KELAS_LIST } from '@/lib/mock-data'
import { toast } from 'sonner'

const siswaSchema = z.object({
  nis: z.string().min(4, 'NIS minimal 4 karakter'),
  nama: z.string().min(2, 'Nama wajib diisi'),
  kelas: z.string().min(1, 'Kelas wajib dipilih'),
  jenisKelamin: z.string().min(1, 'Jenis kelamin wajib dipilih'),
  alamat: z.string().min(3, 'Alamat wajib diisi'),
  telepon: z.string().min(8, 'Telepon minimal 8 digit'),
  email: z.string().email('Email tidak valid'),
})

export default function SiswaPage() {
  const [data, setData] = useState(SISWA_DATA)
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const pageSize = 10

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(siswaSchema),
    defaultValues: { nis: '', nama: '', kelas: '', jenisKelamin: '', alamat: '', telepon: '', email: '' },
  })

  const filtered = useMemo(() => data.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.nama.toLowerCase().includes(q) || s.nis.includes(q) || s.email.toLowerCase().includes(q)
    const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter
    return matchSearch && matchKelas
  }), [data, search, kelasFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

  const onSubmit = (values) => {
    const newSiswa = { id: `SIS-${Date.now()}`, status: 'Aktif', tanggalMasuk: new Date().toISOString().slice(0, 10), ...values }
    setData([newSiswa, ...data])
    toast.success('Siswa berhasil ditambahkan')
    reset()
    setOpen(false)
  }

  const handleDelete = (id) => {
    setData(data.filter(s => s.id !== id))
    toast.success('Siswa berhasil dihapus')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Siswa</h1>
          <p className="text-sm text-muted-foreground">Kelola data master siswa sekolah</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Tambah Siswa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                <DialogDescription>Lengkapi data siswa di bawah ini</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nis">NIS</Label>
                  <Input id="nis" {...register('nis')} placeholder="2024XXXX" />
                  {errors.nis && <p className="text-xs text-destructive">{errors.nis.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input id="nama" {...register('nama')} placeholder="Budi Pratama" />
                  {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Kelas</Label>
                  <Select value={watch('kelas')} onValueChange={(v) => setValue('kelas', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                    <SelectContent>{KELAS_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.kelas && <p className="text-xs text-destructive">{errors.kelas.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis Kelamin</Label>
                  <Select value={watch('jenisKelamin')} onValueChange={(v) => setValue('jenisKelamin', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.jenisKelamin && <p className="text-xs text-destructive">{errors.jenisKelamin.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telepon">Telepon</Label>
                  <Input id="telepon" {...register('telepon')} placeholder="08xxxxxxxxxx" />
                  {errors.telepon && <p className="text-xs text-destructive">{errors.telepon.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="nama@email.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input id="alamat" {...register('alamat')} placeholder="Jl. Pendidikan No. 1" />
                  {errors.alamat && <p className="text-xs text-destructive">{errors.alamat.message}</p>}
                </div>
                <DialogFooter className="md:col-span-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama, NIS, atau email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={kelasFilter} onValueChange={(v) => { setKelasFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {KELAS_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {pageData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"><Users className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-semibold">Tidak ada data siswa</h3>
              <p className="text-sm text-muted-foreground mt-1">Coba ubah pencarian atau filter</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((s) => {
                  const initials = s.nama.split(' ').map(x => x[0]).slice(0,2).join('')
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{s.nama}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                      <TableCell><Badge variant="outline">{s.kelas}</Badge></TableCell>
                      <TableCell className="text-sm">{s.jenisKelamin}</TableCell>
                      <TableCell className="text-sm">{s.telepon}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'Aktif' ? 'default' : 'secondary'} className={s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400' : ''}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> Detail</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
            <p className="text-sm text-muted-foreground">Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length} siswa</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                  <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-9" onClick={() => setPage(i + 1)}>{i + 1}</Button>
                ))}
                {totalPages > 5 && <span className="text-sm text-muted-foreground px-2">...</span>}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Selanjutnya</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
