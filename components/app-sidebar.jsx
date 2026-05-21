'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'
import { useAuthStore } from '@/lib/store/auth-store'
import { canAccess } from '@/lib/auth/roles'
import { GraduationCap, LayoutDashboard, Users, UserCog, School, Wallet, CalendarCheck, Mail, Settings, ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/siswa', label: 'Data Siswa', icon: Users },
  { href: '/guru', label: 'Data Guru', icon: UserCog },
  { href: '/kelas', label: 'Data Kelas', icon: School },
  { href: '/pembayaran', label: 'Pembayaran SPP', icon: Wallet },
  { href: '/absensi', label: 'Absensi Siswa', icon: CalendarCheck },
  { href: '/surat', label: 'Surat Menyurat', icon: Mail },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  // Don't render sidebar if no user (e.g., during logout transition)
  if (!user) return null

  const role = user.role
  const visibleNav = NAV.filter((item) => canAccess(role, item.href))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <div className={cn('flex items-center gap-3 h-16 border-b border-sidebar-border px-4', sidebarCollapsed && 'justify-center px-2')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">SekolahKu</span>
              <span className="text-xs text-muted-foreground">Tata Usaha</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return link
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="w-full justify-center">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" />Tutup</>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
