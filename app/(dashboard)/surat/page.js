'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCrud } from '@/lib/hooks/use-crud'
import { TableSkeleton, EmptyState } from '@/components/table-helpers'
import { Search, Plus, Upload, Mail, Send, FileText, Eye, Download, X, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const masukSchema = z.object({
  nomor: z.string().min(1, 'Nomor wajib'),
  tanggal: z.string().min(1, 'Tanggal wajib'),
  pengirim: z.string().min(1, 'Pengirim wajib'),
  perihal: z.string().min(3, 'Perihal minimal 3 karakter'),
  status: z.string().optional(),
})
const keluarSchema = z.object({
  nomor: z.string().min(1, 'Nomor wajib'),
  tanggal: z.string().min(1, 'Tanggal wajib'),
  tujuan: z.string().min(1, 'Tujuan wajib'),
  perihal: z.string().min(3, 'Perihal minimal 3 karakter'),
  status: z.string().optional(),
})

function SuratForm({ open, onOpenChange, type, onSubmit, editing }) {
  const schema = type === 'masuk' ? masukSchema : keluarSchema
  const isMasuk = type === 'masuk'
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editing || { nomor: '', tanggal: new Date().toISOString().slice(0,10), pengirim: '', tujuan: '', perihal: '', status: isMasuk ? 'Belum Dibaca' : 'Draft' },
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (values) => {
    setSubmitting(true)
    try {
      await onSubmit({ ...values, fileName: file?.name || editing?.fileName || null })
      reset(); setFile(null)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Surat {isMasuk ? 'Masuk' : 'Keluar'}</DialogTitle><DialogDescription>{isMasuk ? 'Catat surat yang masuk ke sekolah' : 'Buat surat keluar baru'}</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Nomor Surat</Label><Input {...register('nomor')} placeholder="001/SM/2025" />{errors.nomor && <p className="text-xs text-destructive">{errors.nomor.message}</p>}</div>
            <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" {...register('tanggal')} />{errors.tanggal && <p className="text-xs text-destructive">{errors.tanggal.message}</p>}</div>
          </div>
          <div className="space-y-1.5"><Label>{isMasuk ? 'Pengirim' : 'Tujuan'}</Label><Input {...register(isMasuk ? 'pengirim' : 'tujuan')} placeholder={isMasuk ? 'Nama instansi pengirim' : 'Nama tujuan surat'} />{(errors.pengirim || errors.tujuan) && <p className="text-xs text-destructive">{(errors.pengirim || errors.tujuan)?.message}</p>}</div>
          <div className="space-y-1.5"><Label>Perihal</Label><Textarea {...register('perihal')} placeholder="Isi singkat surat" rows={2} />{errors.perihal && <p className="text-xs text-destructive">{errors.perihal.message}</p>}</div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{isMasuk ? <><SelectItem value="Belum Dibaca">Belum Dibaca</SelectItem><SelectItem value="Dibaca">Dibaca</SelectItem><SelectItem value="Diarsipkan">Diarsipkan</SelectItem></> : <><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Terkirim">Terkirim</SelectItem></>}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Lampiran File</Label>
            <div className="relative">
              <input type="file" id={`file-${type}`} className="sr-only" onChange={(e) => setFile(e.target.files?.[0])} accept=".pdf,.doc,.docx,.jpg,.png" />
              <label htmlFor={`file-${type}`} className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors">
                {file ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{file.name}</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Klik untuk upload (PDF, DOC, JPG, PNG)</span>
                  </div>
                )}
              </label>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SuratPage() {
  const masukC = useCrud('surat-masuk')
  const keluarC = useCrud('surat-keluar')
  const [tab, setTab] = useState('masuk')
  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteInfo, setDeleteInfo] = useState(null)

  const current = tab === 'masuk' ? masukC : keluarC
  const filtered = current.data.filter(s => !search || s.perihal?.toLowerCase().includes(search.toLowerCase()) || (s.pengirim || s.tujuan || '').toLowerCase().includes(search.toLowerCase()))

  const handleSubmit = async (values) => {
    if (editing) await current.update(editing.id, values)
    else await current.create(values)
    setOpenForm(false); setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Surat Menyurat</h1>
          <p className="text-sm text-muted-foreground">Kelola surat masuk dan surat keluar</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpenForm(true) }}><Plus className="h-4 w-4 mr-2" /> Tambah Surat {tab === 'masuk' ? 'Masuk' : 'Keluar'}</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center"><Mail className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Surat Masuk</p><p className="text-xl font-bold">{masukC.data.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 flex items-center justify-center"><Send className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Surat Keluar</p><p className="text-xl font-bold">{keluarC.data.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center"><FileText className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Belum Dibaca</p><p className="text-xl font-bold">{masukC.data.filter(s => s.status === 'Belum Dibaca').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center"><Send className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Terkirim</p><p className="text-xl font-bold">{keluarC.data.filter(s => s.status === 'Terkirim').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="masuk" className="gap-2"><Mail className="h-4 w-4" /> Surat Masuk</TabsTrigger>
            <TabsTrigger value="keluar" className="gap-2"><Send className="h-4 w-4" /> Surat Keluar</TabsTrigger>
          </TabsList>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari surat..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <TabsContent value="masuk">
          <Card><CardContent className="p-0">
            {masukC.loading ? <TableSkeleton cols={6} /> : filtered.length === 0 ? (
              <EmptyState icon={Mail} title="Belum ada surat masuk" action={<Button size="sm" onClick={() => { setEditing(null); setOpenForm(true) }}><Plus className="h-4 w-4 mr-2" /> Tambah Surat</Button>} />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Tanggal</TableHead><TableHead>Pengirim</TableHead><TableHead>Perihal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.nomor}</TableCell>
                      <TableCell className="text-sm">{s.tanggal}</TableCell>
                      <TableCell className="text-sm font-medium">{s.pengirim}</TableCell>
                      <TableCell className="text-sm">{s.perihal}</TableCell>
                      <TableCell><Badge variant={s.status === 'Belum Dibaca' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(s); setOpenForm(true) }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteInfo({ id: s.id, type: 'masuk' })}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="keluar">
          <Card><CardContent className="p-0">
            {keluarC.loading ? <TableSkeleton cols={6} /> : filtered.length === 0 ? (
              <EmptyState icon={Send} title="Belum ada surat keluar" action={<Button size="sm" onClick={() => { setEditing(null); setOpenForm(true) }}><Plus className="h-4 w-4 mr-2" /> Tambah Surat</Button>} />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Tanggal</TableHead><TableHead>Tujuan</TableHead><TableHead>Perihal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.nomor}</TableCell>
                      <TableCell className="text-sm">{s.tanggal}</TableCell>
                      <TableCell className="text-sm font-medium">{s.tujuan}</TableCell>
                      <TableCell className="text-sm">{s.perihal}</TableCell>
                      <TableCell><Badge variant={s.status === 'Terkirim' ? 'default' : 'secondary'} className={s.status === 'Terkirim' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100' : ''}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(s); setOpenForm(true) }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteInfo({ id: s.id, type: 'keluar' })}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <SuratForm open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null) }} type={tab} editing={editing} onSubmit={handleSubmit} />

      <AlertDialog open={!!deleteInfo} onOpenChange={(o) => !o && setDeleteInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus surat?</AlertDialogTitle><AlertDialogDescription>Data tidak dapat dikembalikan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { const c = deleteInfo.type === 'masuk' ? masukC : keluarC; await c.remove(deleteInfo.id); setDeleteInfo(null) }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
