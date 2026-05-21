'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ABSENSI_DATA, KELAS_LIST, SISWA_DATA } from '@/lib/mock-data'
import { CalendarCheck, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function AbsensiPage() {
  const [date, setDate] = useState(new Date())
  const [kelas, setKelas] = useState(KELAS_LIST[0])
  const siswaKelas = SISWA_DATA.filter(s => s.kelas === kelas).slice(0, 10)
  const [absensi, setAbsensi] = useState({})

  const setStatus = (siswaId, status) => setAbsensi({ ...absensi, [siswaId]: status })

  const handleSave = () => toast.success(`Absensi ${kelas} tanggal ${date.toLocaleDateString('id-ID')} tersimpan`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absensi Siswa</h1>
        <p className="text-sm text-muted-foreground">Catat dan rekap kehadiran siswa</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Pilih Tanggal</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border" />
            <div className="w-full mt-4 space-y-2">
              <label className="text-sm font-medium">Pilih Kelas</label>
              <Select value={kelas} onValueChange={setKelas}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KELAS_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Hadir Kelas {kelas}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Simpan</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {siswaKelas.map((s) => {
                const initials = s.nama.split(' ').map(x => x[0]).slice(0,2).join('')
                const current = absensi[s.id] || 'Hadir'
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30">
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.nama}</p>
                      <p className="text-xs text-muted-foreground">{s.nis}</p>
                    </div>
                    <div className="flex gap-1">
                      {['Hadir','Izin','Sakit','Alpa'].map(st => (
                        <Button key={st} size="sm" variant={current === st ? 'default' : 'outline'} onClick={() => setStatus(s.id, st)} className={current === st && st === 'Hadir' ? 'bg-emerald-600 hover:bg-emerald-700' : current === st && st === 'Alpa' ? 'bg-red-600 hover:bg-red-700' : current === st && st === 'Izin' ? 'bg-blue-600 hover:bg-blue-700' : current === st && st === 'Sakit' ? 'bg-amber-600 hover:bg-amber-700' : ''}>{st}</Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
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
