'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store/auth-store'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { GraduationCap, Eye, EyeOff, Loader2, BookOpen, Users, ClipboardCheck, Wallet, Award, Trophy, Sparkles, Briefcase, Heart, Star } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(4, 'Password minimal 4 karakter'),
  remember: z.boolean().optional(),
})

const ICON_MAP = {
  Users, BookOpen, ClipboardCheck, Wallet, Award, Trophy, Sparkles, Briefcase, Heart, Star, GraduationCap,
}

export default function LoginForm({ branding }) {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/login', { email: data.email, password: data.password })
      login(res.data.user, res.data.token)
      toast.success(`Login berhasil! Selamat datang, ${res.data.user.name}`)
      router.push('/dashboard')
    } catch (e) {
      const msg = e?.response?.data?.error || 'Login gagal. Coba lagi.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Branding berasal dari Server Component (sudah ada fallback). Tidak ada flash.
  const namaSekolah = branding?.namaSekolah || 'SekolahKu'
  const tagline = branding?.taglineApp || 'Tata Usaha Digital'
  const heroTitle = branding?.heroTitle || 'Kelola Administrasi Sekolah dengan Mudah & Efisien'
  const heroSubtitle = branding?.heroSubtitle || 'Platform terintegrasi untuk siswa, guru, pembayaran SPP, absensi, dan administrasi sekolah modern.'
  const heroStats = Array.isArray(branding?.heroStats) ? branding.heroStats : []
  // Dynamic font-size based on name length
  const nameLen = namaSekolah.length
  const nameSizeClass =
    nameLen <= 14 ? 'text-xl' :
    nameLen <= 22 ? 'text-lg' :
    nameLen <= 30 ? 'text-base' :
    'text-sm'

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-7">
          <div className="flex items-start gap-3">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={namaSekolah} className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={cn('font-bold tracking-tight leading-tight line-clamp-2', nameSizeClass)} title={namaSekolah}>{namaSekolah}</h1>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{tagline}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Selamat datang kembali</h2>
            <p className="text-sm text-muted-foreground">Masuk ke akun Anda untuk mengelola administrasi sekolah</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@sekolahku.id" {...register('email')} className="h-11" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={watch('remember')} onCheckedChange={(v) => setValue('remember', !!v)} />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Ingat saya</Label>
              </div>
              <a href="#" className="text-sm font-medium text-primary hover:underline">Lupa password?</a>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-medium">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white w-full">
          <div className="max-w-lg space-y-8">
            <h2 className="text-4xl font-bold leading-tight">{heroTitle}</h2>
            <p className="text-lg text-blue-100">{heroSubtitle}</p>
            <div className="grid grid-cols-2 gap-4">
              {heroStats.map((f, i) => {
                const Icon = ICON_MAP[f.icon] || Users
                return (
                  <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 p-4 text-white">
                    <Icon className="h-6 w-6 mb-2 text-white/90" />
                    <div className="text-2xl font-bold">{f.value}</div>
                    <div className="text-xs text-blue-100">{f.label}</div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
