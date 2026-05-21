// Service Worker for PWA
const CACHE_NAME = 'sekolahku-v1'
const urlsToCache = ['/', '/dashboard']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
  )
})

self.addEventListener('fetch', (event) => {
  // Don't cache API requests - always fetch fresh
  if (event.request.url.includes('/api/')) return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
