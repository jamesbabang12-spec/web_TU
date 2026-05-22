'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/store/auth-store'
import { useBrandingStore } from '@/lib/store/branding-store'
import { ROLE_LABELS, ROLE_BADGE_COLOR, canAccess } from '@/lib/auth/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Bell, Search, Moon, Sun, LogOut, User, Settings as SettingsIcon, Menu, GraduationCap, LayoutDashboard, Users, UserCog, School, Wallet, CalendarCheck, Mail, ShieldCheck } from 'lucide-react'
import { NOTIFIKASI } from '@/lib/mock-data'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/siswa', label: 'Data Siswa', icon: Users },
  { href: '/guru', label: 'Data Guru', icon: UserCog },
  { href: '/kelas', label: 'Data Kelas', icon: School },
  { href: '/pembayaran', label: 'Pembayaran SPP', icon: Wallet },
  { href: '/absensi', label: 'Absensi Siswa', icon: CalendarCheck },
  { href: '/surat', label: 'Surat Menyurat', icon: Mail },
  { href: '/users', label: 'Manajemen User', icon: ShieldCheck },
  { href: '/settings', label: 'Pengaturan', icon: SettingsIcon },
]

export function AppTopbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const branding = useBrandingStore((s) => s.branding)
  const [mobileOpen, setMobileOpen] = useState(false)

  // If user is null (logging out / not authenticated), don't render any user info
  // to prevent flashing "Admin" fallback during logout transition
  if (!user) return null

  const role = user.role
  const visibleNav = NAV.filter((n) => canAccess(role, n.href))
  const namaSekolah = branding?.namaSekolah || 'SekolahKu'
  const tagline = branding?.taglineApp || 'Tata Usaha'
  const logoUrl = branding?.logoUrl
  // Dynamic font-size based on name length
  const nameLen = namaSekolah.length
  const nameSizeClass =
    nameLen <= 14 ? 'text-sm' :
    nameLen <= 22 ? 'text-[13px]' :
    nameLen <= 30 ? 'text-xs' :
    'text-[11px]'

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  const initials = (user.name || 'U').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center gap-3 min-h-16 py-3 border-b px-4">
            {logoUrl ? (
              <img src={logoUrl} alt={namaSekolah} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn('font-bold leading-tight line-clamp-2 break-words', nameSizeClass)} title={namaSekolah}>{namaSekolah}</span>
              <span className="text-[11px] text-muted-foreground truncate mt-0.5">{tagline}</span>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {visibleNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                  <item.icon className="h-5 w-5" /><span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari siswa, guru, kelas..." className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-background" />
      </div>
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-5 w-5 dark:hidden" /><Moon className="h-5 w-5 hidden dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-red-500 hover:bg-red-500">{NOTIFIKASI.length}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">Notifikasi <Badge variant="secondary">{NOTIFIKASI.length} baru</Badge></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {NOTIFIKASI.map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex w-full items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', n.tipe === 'success' && 'bg-green-500', n.tipe === 'warning' && 'bg-amber-500', n.tipe === 'info' && 'bg-blue-500')} />
                    <span className="font-medium text-sm">{n.judul}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{n.waktu}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">{n.deskripsi}</p>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback></Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{user.name}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 h-4 font-medium', ROLE_BADGE_COLOR[role])}>{ROLE_LABELS[role] || '—'}</Badge>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profil</DropdownMenuItem>
            {canAccess(role, '/settings') && (
              <DropdownMenuItem onClick={() => router.push('/settings')}><SettingsIcon className="mr-2 h-4 w-4" /> Pengaturan</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
