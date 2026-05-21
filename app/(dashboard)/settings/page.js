'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/lib/store/auth-store'
import { useTheme } from 'next-themes'
import { User, Bell, Palette, Shield, School, Camera, Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const initials = (user?.name || 'A').split(' ').map(x => x[0]).slice(0,2).join('')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola pengaturan akun dan aplikasi</p>
      </div>

      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto">
          <TabsTrigger value="profil" className="gap-2"><User className="h-4 w-4" /> Profil</TabsTrigger>
          <TabsTrigger value="sekolah" className="gap-2"><School className="h-4 w-4" /> Sekolah</TabsTrigger>
          <TabsTrigger value="tampilan" className="gap-2"><Palette className="h-4 w-4" /> Tampilan</TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-2"><Bell className="h-4 w-4" /> Notifikasi</TabsTrigger>
          <TabsTrigger value="keamanan" className="gap-2"><Shield className="h-4 w-4" /> Keamanan</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card>
            <CardHeader><CardTitle>Profil</CardTitle><CardDescription>Informasi akun pengguna</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20"><AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback></Avatar>
                <div className="space-y-2">
                  <Button size="sm" variant="outline"><Camera className="h-4 w-4 mr-2" /> Ganti Foto</Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG maks 2MB</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Nama Lengkap</Label><Input defaultValue={user?.name || ''} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={user?.email || ''} /></div>
                <div className="space-y-1.5"><Label>Telepon</Label><Input placeholder="08xxxxxxxxxx" /></div>
                <div className="space-y-1.5"><Label>Jabatan</Label><Input defaultValue={user?.role || ''} /></div>
              </div>
              <div className="flex justify-end"><Button onClick={() => toast.success('Profil disimpan')}>Simpan Perubahan</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sekolah">
          <Card>
            <CardHeader><CardTitle>Profil Sekolah</CardTitle><CardDescription>Informasi sekolah</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nama Sekolah</Label><Input defaultValue="SMA SekolahKu" /></div>
              <div className="space-y-1.5"><Label>NPSN</Label><Input defaultValue="12345678" /></div>
              <div className="space-y-1.5"><Label>Kepala Sekolah</Label><Input defaultValue="Drs. Budi Pratama, M.Pd" /></div>
              <div className="space-y-1.5"><Label>Telepon</Label><Input defaultValue="021-12345678" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Alamat</Label><Input defaultValue="Jl. Pendidikan No. 1, Jakarta" /></div>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={() => toast.success('Profil sekolah disimpan')}>Simpan</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tampilan">
          <Card>
            <CardHeader><CardTitle>Tampilan</CardTitle><CardDescription>Sesuaikan tema aplikasi</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Label>Mode Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'light', l: 'Terang', i: Sun },
                  { v: 'dark', l: 'Gelap', i: Moon },
                  { v: 'system', l: 'Sistem', i: Monitor },
                ].map((t) => (
                  <button key={t.v} onClick={() => setTheme(t.v)} className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === t.v ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <t.i className="h-6 w-6" />
                    <span className="text-sm font-medium">{t.l}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifikasi">
          <Card>
            <CardHeader><CardTitle>Notifikasi</CardTitle><CardDescription>Atur preferensi notifikasi</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { l: 'Notifikasi Email', d: 'Terima email untuk aktivitas penting' },
                { l: 'Notifikasi Pembayaran', d: 'Update saat pembayaran SPP masuk' },
                { l: 'Notifikasi Surat', d: 'Pemberitahuan surat masuk baru' },
                { l: 'Notifikasi Absensi', d: 'Laporan absensi harian' },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div><p className="font-medium text-sm">{n.l}</p><p className="text-xs text-muted-foreground">{n.d}</p></div>
                  <Switch defaultChecked={i < 2} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keamanan">
          <Card>
            <CardHeader><CardTitle>Keamanan</CardTitle><CardDescription>Ubah password dan keamanan akun</CardDescription></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5"><Label>Password Lama</Label><Input type="password" placeholder="••••••••" /></div>
              <div className="space-y-1.5"><Label>Password Baru</Label><Input type="password" placeholder="••••••••" /></div>
              <div className="space-y-1.5"><Label>Konfirmasi Password</Label><Input type="password" placeholder="••••••••" /></div>
              <Button onClick={() => toast.success('Password berhasil diubah')}>Ubah Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
