'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // wait for zustand persist hydration
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!user && pathname !== '/') {
      router.replace('/')
    }
  }, [ready, user, pathname, router])

  // Show loader while hydrating OR when user is null (about to redirect)
  // This prevents flashing stale UI between logout() and router.replace('/')
  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return children
}
