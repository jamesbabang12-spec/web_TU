'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, UserCog, School, Wallet, TrendingUp, TrendingDown, ArrowUpRight, CalendarCheck, AlertCircle } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { NOTIFIKASI } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const formatIDR = (v) => 'Rp ' + (v / 1000000).toFixed(1) + 'jt'
const formatIDRFull = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [pembayaranList, setPembayaranList] = useState(null) // null=loading, []=empty, [...]=data
  const [chartType, setChartType] = useState('area')

  useEffect(() => {
    // Fetch parallel — tidak waterfall
    apiClient.get('/stats').then((r) => setStats(r.data)).catch(() => setStats({}))
    apiClient.get('/pembayaran').then((r) => {
      const list = (r.data || [])
        .filter(p => p.status === 'Lunas')
        .sort((a, b) => new Date(b.tanggalBayar || b.createdAt || 0) - new Date(a.tanggalBayar || a.createdAt || 0))
        .slice(0, 5)
      setPembayaranList(list)
    }).catch(() => setPembayaranList([]))
  }, [])

  const statCards = stats
    ? [
        { label: 'Total Siswa', value: stats.totalSiswa, icon: Users, color: 'from-blue-500 to-blue-600', trend: '+12%', up: true },
        { label: 'Total Guru', value: stats.totalGuru, icon: UserCog, color: 'from-violet-500 to-violet-600', trend: '+2%', up: true },
        { label: 'Total Kelas', value: stats.totalKelas, icon: School, color: 'from-amber-500 to-orange-500', trend: '0%', up: true },
        { label: 'Pembayaran Hari Ini', value: formatIDR(stats.pembayaranHariIni), icon: Wallet, color: 'from-emerald-500 to-emerald-600', trend: '+8.5%', up: true },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan administrasi sekolah hari ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>
        <Badge variant="secondary" className="w-fit">Tahun Ajaran 2025/2026</Badge>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {!stats && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        {statCards.map((s, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10', s.color)} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <Badge variant={s.up ? 'default' : 'destructive'} className={cn('gap-1', s.up && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400')}>
                  {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {s.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Grafik Keuangan</CardTitle>
              <CardDescription>Pemasukan vs Pengeluaran 6 bulan terakhir</CardDescription>
            </div>
            <Tabs value={chartType} onValueChange={setChartType} className="w-fit">
              <TabsList className="h-8">
                <TabsTrigger value="area" className="text-xs h-6">Area</TabsTrigger>
                <TabsTrigger value="bar" className="text-xs h-6">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {stats?.pemasukanChart ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'area' ? (
                  <AreaChart data={stats.pemasukanChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="bulan" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => formatIDR(v)} />
                    <Tooltip formatter={(v) => formatIDRFull(v)} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="pemasukan" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#gIn)" />
                    <Area type="monotone" dataKey="pengeluaran" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#gOut)" />
                  </AreaChart>
                ) : (
                  <BarChart data={stats.pemasukanChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="bulan" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => formatIDR(v)} />
                    <Tooltip formatter={(v) => formatIDRFull(v)} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pemasukan" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pengeluaran" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : <Skeleton className="h-[300px] w-full" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Siswa</CardTitle>
            <CardDescription>Berdasarkan jenjang</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {stats?.kelasDistribusi ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.kelasDistribusi} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {stats.kelasDistribusi.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[220px] w-full" />}
            <div className="flex gap-6 mt-2">
              {stats?.kelasDistribusi?.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-sm" style={{ background: d.fill }} />
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Absensi Minggu Ini</CardTitle>
            <CardDescription>Rekap kehadiran siswa per hari</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.absensiChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="hari" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="hadir" stackId="a" fill="hsl(var(--chart-2))" radius={[0,0,0,0]} />
                  <Bar dataKey="izin" stackId="a" fill="hsl(var(--chart-4))" />
                  <Bar dataKey="sakit" stackId="a" fill="hsl(var(--chart-5))" />
                  <Bar dataKey="alpa" stackId="a" fill="hsl(var(--chart-1))" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[240px] w-full" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary" /> Notifikasi</CardTitle>
            <CardDescription>Aktivitas terbaru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFIKASI.map((n) => (
              <div key={n.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.tipe === 'success' && 'bg-emerald-500', n.tipe === 'warning' && 'bg-amber-500', n.tipe === 'info' && 'bg-blue-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.judul}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.deskripsi}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.waktu}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pembayaran SPP Terbaru</CardTitle>
            <CardDescription>5 transaksi terbaru</CardDescription>
          </div>
          <Link href="/pembayaran" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">Lihat semua <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </CardHeader>
        <CardContent>
          {pembayaranList === null ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : pembayaranList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Belum ada pembayaran lunas</div>
          ) : (
            <div className="space-y-1">
              {pembayaranList.map((p) => {
                const nama = p.namaSiswa || 'Siswa'
                const initials = nama.split(' ').map(x => x[0]).slice(0, 2).join('') || 'S'
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nama}</p>
                      <p className="text-xs text-muted-foreground">SPP {p.bulan} • {p.kelas || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatIDRFull(p.jumlah || 0)}</p>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-950 dark:text-emerald-400">{p.status}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
