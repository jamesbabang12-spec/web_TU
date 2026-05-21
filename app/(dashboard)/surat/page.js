'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SURAT_MASUK, SURAT_KELUAR } from '@/lib/mock-data'
import { Search, Plus, Upload, Mail, Send, FileText, Eye, Download, X } from 'lucide-react'
import { toast } from 'sonner'

export default function SuratPage() {
  const [masuk, setMasuk] = useState(SURAT_MASUK)
  const [keluar, setKeluar] = useState(SURAT_KELUAR)
  const [search, setSearch] = useState('')
  const [file, setFile] = useState(null)
  const [open, setOpen] = useState(false)

  const handleUpload = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleSubmitSurat = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const newSurat = {
      id: `SM-${Date.now()}`,
      nomor: form.get('nomor'),
      tanggal: new Date().toISOString().slice(0, 10),
      pengirim: form.get('pengirim'),
      perihal: form.get('perihal'),
      status: 'Belum Dibaca',
    }
    setMasuk([newSurat, ...masuk])
    toast.success('Surat berhasil ditambahkan')
    setFile(null)
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Surat Menyurat</h1>
          <p className="text-sm text-muted-foreground">Kelola surat masuk dan surat keluar</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Tambah Surat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Surat Masuk</DialogTitle>
              <DialogDescription>Catat surat yang masuk ke sekolah</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitSurat} className="space-y-4">
              <div className="space-y-1.5"><Label>Nomor Surat</Label><Input name="nomor" placeholder="001/SM/2025" required /></div>
              <div className="space-y-1.5"><Label>Pengirim</Label><Input name="pengirim" placeholder="Nama instansi pengirim" required /></div>
              <div className="space-y-1.5"><Label>Perihal</Label><Textarea name="perihal" placeholder="Isi singkat surat" required /></div>
              <div className="space-y-1.5">
                <Label>Lampiran File</Label>
                <div className="relative">
                  <input type="file" id="file" className="sr-only" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                  <label htmlFor="file" className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center"><Mail className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Surat Masuk</p><p className="text-xl font-bold">{masuk.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 flex items-center justify-center"><Send className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Surat Keluar</p><p className="text-xl font-bold">{keluar.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center"><FileText className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Belum Dibaca</p><p className="text-xl font-bold">{masuk.filter(s => s.status === 'Belum Dibaca').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center"><Send className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Terkirim</p><p className="text-xl font-bold">{keluar.filter(s => s.status === 'Terkirim').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="masuk">
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Tanggal</TableHead><TableHead>Pengirim</TableHead><TableHead>Perihal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {masuk.filter(s => !search || s.perihal.toLowerCase().includes(search.toLowerCase()) || s.pengirim.toLowerCase().includes(search.toLowerCase())).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.nomor}</TableCell>
                      <TableCell className="text-sm">{s.tanggal}</TableCell>
                      <TableCell className="text-sm font-medium">{s.pengirim}</TableCell>
                      <TableCell className="text-sm">{s.perihal}</TableCell>
                      <TableCell><Badge variant={s.status === 'Belum Dibaca' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keluar">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Tanggal</TableHead><TableHead>Tujuan</TableHead><TableHead>Perihal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {keluar.filter(s => !search || s.perihal.toLowerCase().includes(search.toLowerCase()) || s.tujuan.toLowerCase().includes(search.toLowerCase())).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.nomor}</TableCell>
                      <TableCell className="text-sm">{s.tanggal}</TableCell>
                      <TableCell className="text-sm font-medium">{s.tujuan}</TableCell>
                      <TableCell className="text-sm">{s.perihal}</TableCell>
                      <TableCell><Badge variant={s.status === 'Terkirim' ? 'default' : 'secondary'} className={s.status === 'Terkirim' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100' : ''}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
