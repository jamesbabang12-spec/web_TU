'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store/auth-store'
import { useTheme } from 'next-themes'
import { apiClient } from '@/lib/api/client'
import { User, Bell, Palette, Shield, School, Camera, Sun, Moon, Monitor, Sparkles, Upload, X, ImageIcon, Loader2, Wallet, Users, BookOpen, ClipboardCheck, Award, Trophy, Briefcase, Heart, Star, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

const ICON_OPTIONS = [
  { value: 'Users', label: 'Users', Icon: Users },
  { value: 'BookOpen', label: 'Buku', Icon: BookOpen },
  { value: 'ClipboardCheck', label: 'Clipboard', Icon: ClipboardCheck },
  { value: 'Wallet', label: 'Wallet', Icon: Wallet },
  { value: 'Award', label: 'Award', Icon: Award },
  { value: 'Trophy', label: 'Trophy', Icon: Trophy },
  { value: 'Sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'Briefcase', label: 'Briefcase', Icon: Briefcase },
  { value: 'Heart', label: 'Heart', Icon: Heart },
  { value: 'Star', label: 'Star', Icon: Star },
  { value: 'GraduationCap', label: 'Topi Wisuda', Icon: GraduationCap },
]

const ICON_MAP = ICON_OPTIONS.reduce((acc, x) => { acc[x.value] = x.Icon; return acc }, {})

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const initials = (user?.name || 'A').split(' ').map(x => x[0]).slice(0, 2).join('')

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get('/settings').then(r => {
      const data = r.data || {}
      setSettings({
        namaSekolah: data.namaSekolah || '',
        npsn: data.npsn || '',
        kepalaSekolah: data.kepalaSekolah || '',
        telepon: data.telepon || '',
        emailSekolah: data.emailSekolah || '',
        alamat: data.alamat || '',
        sppSMP: data.sppSMP || 400000,
        sppSMA: data.sppSMA || 600000,
        logoUrl: data.logoUrl || '',
        taglineApp: data.taglineApp || 'Tata Usaha Digital',
        heroTitle: data.heroTitle || 'Kelola Administrasi Sekolah dengan Mudah & Efisien',
        heroSubtitle: data.heroSubtitle || 'Platform terintegrasi untuk siswa, guru, pembayaran SPP, absensi, dan administrasi sekolah modern.',
        heroStats: Array.isArray(data.heroStats) && data.heroStats.length === 4 ? data.heroStats : [
          { icon: 'Users', value: '444+', label: 'Manajemen Siswa' },
          { icon: 'BookOpen', value: '24', label: 'Mata Pelajaran' },
          { icon: 'ClipboardCheck', value: '97%', label: 'Kehadiran Hari Ini' },
          { icon: 'Wallet', value: '89%', label: 'SPP Lunas' },
        ],
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateField = (key, value) => setSettings(s => ({ ...s, [key]: value }))
  const updateHeroStat = (i, field, value) => setSettings(s => ({
    ...s,
    heroStats: s.heroStats.map((x, idx) => idx === i ? { ...x, [field]: value } : x),
  }))

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      toast.error('Ukuran logo maksimal 500KB')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      toast.error('Format harus PNG, JPG, SVG, atau WebP')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => updateField('logoUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const saveBranding = async () => {
    setSaving(true)
    try {
      await apiClient.put('/settings', settings)
      toast.success('Pengaturan tampilan login berhasil disimpan!')
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan')
    } finally { setSaving(false) }
  }

  const saveSekolah = async () => {
    setSaving(true)
    try {
      await apiClient.put('/settings', settings)
      toast.success('Profil sekolah berhasil disimpan')
    } catch (e) { toast.error('Gagal menyimpan') } finally { setSaving(false) }
  }

  if (loading || !settings) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola pengaturan akun dan aplikasi</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:flex sm:w-auto">
          <TabsTrigger value="branding" className="gap-2"><Sparkles className="h-4 w-4" /> Tampilan Login</TabsTrigger>
          <TabsTrigger value="sekolah" className="gap-2"><School className="h-4 w-4" /> Sekolah</TabsTrigger>
          <TabsTrigger value="profil" className="gap-2"><User className="h-4 w-4" /> Profil</TabsTrigger>
          <TabsTrigger value="tampilan" className="gap-2"><Palette className="h-4 w-4" /> Tema</TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-2"><Bell className="h-4 w-4" /> Notifikasi</TabsTrigger>
          <TabsTrigger value="keamanan" className="gap-2"><Shield className="h-4 w-4" /> Keamanan</TabsTrigger>
        </TabsList>

        {/* Branding Tab - NEW */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Logo Sekolah</CardTitle>
              <CardDescription>Logo akan tampil di halaman login dan sidebar aplikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative">
                  {settings.logoUrl ? (
                    <div className="relative group">
                      <img src={settings.logoUrl} alt="Logo" className="h-32 w-32 rounded-2xl object-cover border-2 border-border" />
                      <button onClick={() => updateField('logoUrl', '')} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 flex-1">
                  <input type="file" id="logo-upload" className="sr-only" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} />
                  <label htmlFor="logo-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-muted cursor-pointer text-sm font-medium transition-colors">
                    <Upload className="h-4 w-4" /> {settings.logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                  </label>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Format: PNG, JPG, SVG, WebP</p>
                    <p>• Ukuran maksimal: 500 KB</p>
                    <p>• Disarankan: persegi (1:1), minimal 200×200px</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identitas Aplikasi</CardTitle>
              <CardDescription>Nama dan tagline yang tampil di halaman login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Aplikasi / Sekolah <span className="text-destructive">*</span></Label>
                  <Input value={settings.namaSekolah} onChange={(e) => updateField('namaSekolah', e.target.value)} placeholder="SekolahKu" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tagline Aplikasi</Label>
                  <Input value={settings.taglineApp} onChange={(e) => updateField('taglineApp', e.target.value)} placeholder="Tata Usaha Digital" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero Banner (Panel Kanan Login)</CardTitle>
              <CardDescription>Judul utama dan tagline pemasaran di halaman login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Judul Hero</Label>
                <Textarea value={settings.heroTitle} onChange={(e) => updateField('heroTitle', e.target.value)} rows={2} placeholder="Kelola Administrasi Sekolah dengan Mudah & Efisien" />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle Hero</Label>
                <Textarea value={settings.heroSubtitle} onChange={(e) => updateField('heroSubtitle', e.target.value)} rows={3} placeholder="Platform terintegrasi untuk..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kartu Statistik Login (4 Kartu)</CardTitle>
              <CardDescription>Statistik yang ditampilkan di panel kanan halaman login</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.heroStats.map((stat, i) => {
                  const Icon = ICON_MAP[stat.icon] || Users
                  return (
                    <Card key={i} className="border-dashed">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">Kartu #{i + 1}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Icon</Label>
                            <Select value={stat.icon} onValueChange={(v) => updateHeroStat(i, 'icon', v)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ICON_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2"><opt.Icon className="h-4 w-4" /> {opt.label}</div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Nilai</Label>
                              <Input className="h-9" value={stat.value} onChange={(e) => updateHeroStat(i, 'value', e.target.value)} placeholder="444+" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Label</Label>
                              <Input className="h-9" value={stat.label} onChange={(e) => updateHeroStat(i, 'label', e.target.value)} placeholder="Manajemen Siswa" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Preview Halaman Login</CardTitle>
              <CardDescription>Begini tampilan halaman login dengan pengaturan sekarang</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden border bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white p-8 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="relative space-y-5">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover bg-white/20" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center"><GraduationCap className="h-6 w-6" /></div>
                    )}
                    <div>
                      <p className="font-bold">{settings.namaSekolah || 'SekolahKu'}</p>
                      <p className="text-xs text-blue-100">{settings.taglineApp}</p>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight max-w-md">{settings.heroTitle}</h3>
                  <p className="text-sm text-blue-100 max-w-md line-clamp-2">{settings.heroSubtitle}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {settings.heroStats.map((stat, i) => {
                      const Icon = ICON_MAP[stat.icon] || Users
                      return (
                        <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg">
                          <Icon className="h-4 w-4 mb-1 text-white/90" />
                          <div className="text-base font-bold">{stat.value}</div>
                          <div className="text-[10px] text-blue-100 truncate">{stat.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 sticky bottom-4 z-10">
            <Button onClick={saveBranding} disabled={saving} size="lg" className="shadow-xl">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Sparkles className="h-4 w-4 mr-2" /> Simpan Tampilan Login
            </Button>
          </div>
        </TabsContent>

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
            <CardHeader><CardTitle>Profil Sekolah</CardTitle><CardDescription>Informasi resmi sekolah</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nama Sekolah</Label><Input value={settings.namaSekolah} onChange={(e) => updateField('namaSekolah', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>NPSN</Label><Input value={settings.npsn} onChange={(e) => updateField('npsn', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Kepala Sekolah</Label><Input value={settings.kepalaSekolah} onChange={(e) => updateField('kepalaSekolah', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Telepon</Label><Input value={settings.telepon} onChange={(e) => updateField('telepon', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email Sekolah</Label><Input type="email" value={settings.emailSekolah} onChange={(e) => updateField('emailSekolah', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>SPP SMP (Rp/bulan)</Label><Input type="number" value={settings.sppSMP} onChange={(e) => updateField('sppSMP', Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>SPP SMA (Rp/bulan)</Label><Input type="number" value={settings.sppSMA} onChange={(e) => updateField('sppSMA', Number(e.target.value))} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Alamat</Label><Textarea value={settings.alamat} onChange={(e) => updateField('alamat', e.target.value)} rows={2} /></div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={saveSekolah} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tampilan">
          <Card>
            <CardHeader><CardTitle>Tema</CardTitle><CardDescription>Sesuaikan tema aplikasi</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Label>Mode Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                {[{ v: 'light', l: 'Terang', i: Sun }, { v: 'dark', l: 'Gelap', i: Moon }, { v: 'system', l: 'Sistem', i: Monitor }].map((t) => (
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
