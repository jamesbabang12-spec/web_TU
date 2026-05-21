'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KELAS_DATA } from '@/lib/mock-data'
import { Plus, School, Users, MapPin, UserCog } from 'lucide-react'
import { toast } from 'sonner'

export default function KelasPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Kelas</h1>
          <p className="text-sm text-muted-foreground">Daftar kelas dan wali kelas</p>
        </div>
        <Button size="sm" onClick={() => toast.info('Form tambah kelas')}><Plus className="h-4 w-4 mr-2" /> Tambah Kelas</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {KELAS_DATA.map((k) => (
          <Card key={k.id} className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{k.nama}</CardTitle>
                  <p className="text-xs text-muted-foreground">{k.id}</p>
                </div>
              </div>
              <Badge variant={k.tingkat === 'SMP' ? 'secondary' : 'default'}>{k.tingkat}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center gap-2 text-sm"><UserCog className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{k.waliKelas}</span></div>
              <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{k.jumlahSiswa}</span><span className="text-muted-foreground">siswa</span></div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>Ruangan {k.ruangan}</span></div>
              <div className="pt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Detail</Button>
                <Button size="sm" variant="outline" className="flex-1">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
