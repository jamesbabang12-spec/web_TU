'use client'

import { useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { AppTopbar } from '@/components/app-topbar'
import { AIChatbot } from '@/components/ai-chatbot'
import { useBrandingStore } from '@/lib/store/branding-store'

export default function DashboardLayout({ children }) {
  const fetchBranding = useBrandingStore((s) => s.fetch)
  // Fetch branding sekali untuk seluruh dashboard layout (shared via Zustand)
  useEffect(() => { fetchBranding() }, [fetchBranding])

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AppTopbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
        <AIChatbot />
      </div>
    </AuthGuard>
  )
}
