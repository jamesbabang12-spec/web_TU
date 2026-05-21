'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCrud } from '@/lib/hooks/use-crud'
import { TableSkeleton, EmptyState } from '@/components/table-helpers'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Edit, Trash2, Download, Mail, Phone, UserCog, Loader2, FileSpreadsheet, FileText } from 'lucide-react'

const MAPEL = ['Matematika','Bahasa Indonesia','Bahasa Inggris','IPA','IPS','PKN','Agama','Olahraga','Seni Budaya','TIK','Fisika','Kimia','Biologi','Sejarah','Geografi','Ekonomi']

const guruSchema = z.object({
  nip: z.string().min(5, 'NIP minimal 5 karakter'),
  nama: z.string().min(2, 'Nama wajib diisi'),
  mapel: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  jenisKelamin: z.string().min(1, 'Wajib dipilih'),
  telepon: z.string().min(8, 'Telepon minimal 8 digit'),
  email: z.string().email('Email tidak valid'),
  status: z.string().optional(),
})

export default function GuruPage() {
  const { data, loading, create, update, remove } = useCrud('guru')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(guruSchema),
    defaultValues: { nip: '', nama: '', mapel: '', jenisKelamin: '', telepon: '', email: '', status: 'Aktif' },
  })

  const filtered = data.filter(g => !search || g.nama?.toLowerCase().includes(search.toLowerCase()) || g.mapel?.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); reset({ nip: '', nama: '', mapel: '', jenisKelamin: '', telepon: '', email: '', status: 'Aktif' }); setOpen(true) }
  const openEdit = (g) => { setEditing(g); reset(g); setOpen(true) }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      if (editing) await update(editing.id, values)
      else await create(values)
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Guru</h1>
          <p className="text-sm text-muted-foreground">Kelola data master guru dan tenaga pendidik</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToExcel(filtered.map(g => ({ NIP: g.nip, Nama: g.nama, 'Mata Pelajaran': g.mapel, 'Jenis Kelamin': g.jenisKelamin, Telepon: g.telepon, Email: g.email, Status: g.status })), `data-guru-${new Date().toISOString().slice(0,10)}`, 'Data Guru')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF({ title: 'Data Guru SekolahKu', subtitle: `Total: ${filtered.length} guru - ${new Date().toLocaleDateString('id-ID')}`, columns: ['NIP','Nama','Mapel','JK','Telepon','Email','Status'], rows: filtered.map(g => [g.nip, g.nama, g.mapel, g.jenisKelamin, g.telepon, g.email, g.status]), filename: `data-guru-${new Date().toISOString().slice(0,10)}`, orientation: 'landscape' })}>
                <FileText className="h-4 w-4 mr-2 text-red-600" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Tambah Guru</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Guru</p><p className="text-2xl font-bold">{data.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Laki-laki</p><p className="text-2xl font-bold">{data.filter(g => g.jenisKelamin === 'Laki-laki').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Perempuan</p><p className="text-2xl font-bold">{data.filter(g => g.jenisKelamin === 'Perempuan').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Aktif</p><p className="text-2xl font-bold text-emerald-600">{data.filter(g => g.status === 'Aktif').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama atau mata pelajaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          {loading ? <TableSkeleton cols={6} /> : filtered.length === 0 ? (
            <EmptyState icon={UserCog} title="Tidak ada data guru" description="Tambah guru pertama untuk memulai" action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Tambah Guru</Button>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Guru</TableHead><TableHead>NIP</TableHead><TableHead>Mata Pelajaran</TableHead><TableHead>Kontak</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const initials = (g.nama || '').split(' ').filter(x => !x.includes('.')).slice(0,2).map(x => x[0]).join('') || 'GR'
                  return (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">{initials}</AvatarFallback></Avatar>
                          <div><p className="font-medium text-sm">{g.nama}</p><p className="text-xs text-muted-foreground">{g.jenisKelamin}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{g.nip}</TableCell>
                      <TableCell><Badge variant="outline">{g.mapel}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> {g.telepon}</span>
                          <span className="text-xs flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {g.email}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400">{g.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(g)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle><DialogDescription>Lengkapi data guru di bawah ini</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>NIP</Label><Input {...register('nip')} placeholder="196801011990121001" />{errors.nip && <p className="text-xs text-destructive">{errors.nip.message}</p>}</div>
            <div className="space-y-1.5"><Label>Nama Lengkap</Label><Input {...register('nama')} placeholder="Drs. Budi Pratama" />{errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}</div>
            <div className="space-y-1.5"><Label>Mata Pelajaran</Label>
              <Select value={watch('mapel')} onValueChange={(v) => setValue('mapel', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                <SelectContent>{MAPEL.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              {errors.mapel && <p className="text-xs text-destructive">{errors.mapel.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Jenis Kelamin</Label>
              <Select value={watch('jenisKelamin')} onValueChange={(v) => setValue('jenisKelamin', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
              </Select>
              {errors.jenisKelamin && <p className="text-xs text-destructive">{errors.jenisKelamin.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Telepon</Label><Input {...register('telepon')} placeholder="08xxxxxxxxxx" />{errors.telepon && <p className="text-xs text-destructive">{errors.telepon.message}</p>}</div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...register('email')} placeholder="guru@sekolahku.id" />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
            <div className="space-y-1.5 md:col-span-2"><Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Aktif">Aktif</SelectItem><SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter className="md:col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editing ? 'Simpan Perubahan' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus data guru?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await remove(deleteId); setDeleteId(null) }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
