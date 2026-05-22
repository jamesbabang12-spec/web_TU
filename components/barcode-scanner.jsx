'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Camera, CameraOff, Loader2, RefreshCw } from 'lucide-react'

export function BarcodeScanner({ onScan, paused = false }) {
  const containerRef = useRef(null)
  const scannerRef = useRef(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const lastScanRef = useRef({ code: '', time: 0 })

  // Detect cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCameras(devices)
        // Prefer rear camera if available
        const rear = devices.find(d => /back|rear|environment/i.test(d.label))
        setSelectedCamera(rear?.id || devices[0].id)
      } else {
        setError('Tidak ada kamera ditemukan')
      }
    }).catch((e) => {
      setError(e?.message || 'Gagal mengakses kamera. Berikan izin kamera di browser.')
    })

    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanner = async () => {
    if (!selectedCamera || !containerRef.current) return
    setError(null)
    try {
      const scanner = new Html5Qrcode('barcode-reader')
      scannerRef.current = scanner
      await scanner.start(
        selectedCamera,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          // Debounce: same code within 1500ms ignored
          const now = Date.now()
          if (lastScanRef.current.code === decodedText && now - lastScanRef.current.time < 1500) return
          lastScanRef.current = { code: decodedText, time: now }
          onScan?.(decodedText)
        },
        () => {} // ignore scan errors
      )
      setActive(true)
    } catch (e) {
      setError(e?.message || 'Gagal memulai kamera')
      setActive(false)
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      }
    } catch {}
    scannerRef.current = null
    setActive(false)
  }

  // Pause/resume effect
  useEffect(() => {
    if (paused && scannerRef.current?.isScanning) {
      stopScanner()
    }
  }, [paused])

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative w-full aspect-square max-w-sm mx-auto bg-muted rounded-xl overflow-hidden border-2 border-dashed">
        <div id="barcode-reader" className="w-full h-full" />
        {!active && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
            <Camera className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Klik "Mulai Scan" untuk mengaktifkan kamera</p>
          </div>
        )}
        {active && (
          <>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-4 border-emerald-400 rounded-lg shadow-[0_0_0_2000px_rgba(0,0,0,0.4)]" />
            </div>
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> SCANNING
            </div>
          </>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-2 bg-destructive/10">
            <CameraOff className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">Pastikan izin kamera diberikan di browser</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {!active ? (
          <Button onClick={startScanner} disabled={!selectedCamera || error}>
            <Camera className="h-4 w-4 mr-2" /> Mulai Scan
          </Button>
        ) : (
          <Button variant="outline" onClick={stopScanner}>
            <CameraOff className="h-4 w-4 mr-2" /> Stop Scan
          </Button>
        )}
        {cameras.length > 1 && (
          <Button variant="outline" size="sm" onClick={async () => {
            await stopScanner()
            const idx = cameras.findIndex(c => c.id === selectedCamera)
            const next = cameras[(idx + 1) % cameras.length]
            setSelectedCamera(next.id)
            setTimeout(() => startScanner(), 300)
          }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Ganti Kamera
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Arahkan kamera ke QR Code / Barcode pada kartu siswa
      </p>
    </div>
  )
}
