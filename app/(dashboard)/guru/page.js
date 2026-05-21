'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GURU_DATA } from '@/lib/mock-data'
import { Plus, Search, Edit, Trash2, Download, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function GuruPage() {
  const [data, setData] = useState(GURU_DATA)
  const [search, setSearch] = useState('')
  const filtered = data.filter(g => !search || g.nama.toLowerCase().includes(search.toLowerCase()) || g.mapel.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Guru</h1>
          <p className="text-sm text-muted-foreground">Kelola data master guru dan tenaga pendidik</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button size="sm" onClick={() => toast.info('Form tambah guru')}><Plus className="h-4 w-4 mr-2" /> Tambah Guru</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => {
                const initials = g.nama.split(' ').filter(x => !x.includes('.')).slice(0,2).map(x => x[0]).join('')
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">{initials || 'GR'}</AvatarFallback></Avatar>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setData(data.filter(x => x.id !== g.id)); toast.success('Guru dihapus') }}><Trash2 className="h-4 w-4" /></Button>
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
