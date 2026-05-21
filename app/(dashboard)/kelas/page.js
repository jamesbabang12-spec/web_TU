'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCrud } from '@/lib/hooks/use-crud'
import { Plus, School, Users, MapPin, UserCog, Edit, Trash2, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

const kelasSchema = z.object({
  nama: z.string().min(1, 'Nama kelas wajib diisi'),
  tingkat: z.string().min(1, 'Tingkat wajib dipilih'),
  waliKelas: z.string().min(1, 'Wali kelas wajib dipilih'),
  ruangan: z.string().min(1, 'Ruangan wajib diisi'),
  jumlahSiswa: z.coerce.number().min(0).optional(),
})

export default function KelasPage() {
  const { data, loading, create, update, remove } = useCrud('kelas')
  const [guruList, setGuruList] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiClient.get('/guru').then(r => setGuruList(r.data || [])).catch(() => {})
  }, [])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(kelasSchema),
    defaultValues: { nama: '', tingkat: 'SMP', waliKelas: '', ruangan: '', jumlahSiswa: 0 },
  })

  const openCreate = () => { setEditing(null); reset({ nama: '', tingkat: 'SMP', waliKelas: '', ruangan: '', jumlahSiswa: 0 }); setOpen(true) }
  const openEdit = (k) => { setEditing(k); reset(k); setOpen(true) }

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
          <h1 className="text-2xl font-bold tracking-tight">Data Kelas</h1>
          <p className="text-sm text-muted-foreground">Daftar kelas dan wali kelas</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Tambah Kelas</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((k) => (
            <Card key={k.id} className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><School className="h-5 w-5" /></div>
                  <div><CardTitle className="text-base">{k.nama}</CardTitle><p className="text-xs text-muted-foreground">{k.id?.slice(0, 8)}</p></div>
                </div>
                <Badge variant={k.tingkat === 'SMP' ? 'secondary' : 'default'}>{k.tingkat}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2 text-sm"><UserCog className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{k.waliKelas}</span></div>
                <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{k.jumlahSiswa || 0}</span><span className="text-muted-foreground">siswa</span></div>
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>Ruangan {k.ruangan}</span></div>
                <div className="pt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(k)}><Edit className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(k.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle><DialogDescription>Lengkapi data kelas</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nama Kelas</Label><Input {...register('nama')} placeholder="7A" />{errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}</div>
            <div className="space-y-1.5"><Label>Tingkat</Label>
              <Select value={watch('tingkat')} onValueChange={(v) => setValue('tingkat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SMP">SMP</SelectItem><SelectItem value="SMA">SMA</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Wali Kelas</Label>
              <Select value={watch('waliKelas')} onValueChange={(v) => setValue('waliKelas', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih wali kelas" /></SelectTrigger>
                <SelectContent>{guruList.map(g => <SelectItem key={g.id} value={g.nama}>{g.nama} — {g.mapel}</SelectItem>)}</SelectContent>
              </Select>
              {errors.waliKelas && <p className="text-xs text-destructive">{errors.waliKelas.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Ruangan</Label><Input {...register('ruangan')} placeholder="R-101" />{errors.ruangan && <p className="text-xs text-destructive">{errors.ruangan.message}</p>}</div>
            <div className="space-y-1.5"><Label>Jumlah Siswa</Label><Input type="number" {...register('jumlahSiswa')} placeholder="30" /></div>
            <DialogFooter className="col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editing ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus kelas?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { await remove(deleteId); setDeleteId(null) }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
