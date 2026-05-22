// Loading state yang langsung muncul saat navigasi antar menu di dashboard
// Next.js App Router otomatis tampilkan komponen ini saat segment masih loading
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <>
      {/* Top progress bar - instant feedback */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/20 pointer-events-none">
        <div className="h-full w-1/3 bg-primary animate-[progress_1.5s_ease-in-out_infinite] shadow-[0_0_10px_hsl(var(--primary))]" />
      </div>

      {/* Skeleton content */}
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Memuat halaman...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted/50 border" />
          ))}
        </div>
        <div className="h-96 rounded-lg bg-muted/50 border" />
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </>
  )
}
