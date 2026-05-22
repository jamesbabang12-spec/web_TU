import { create } from 'zustand'

// Global branding store - fetched once per session, shared by sidebar/topbar/etc.
export const useBrandingStore = create((set, get) => ({
  branding: null,
  loading: false,
  fetched: false,
  fetch: async (force = false) => {
    if (get().loading) return
    if (get().fetched && !force) return
    set({ loading: true })
    try {
      const res = await fetch('/api/settings/public', { cache: 'no-store' })
      const data = await res.json()
      set({ branding: data || {}, fetched: true })
    } catch {
      set({ branding: {}, fetched: true })
    } finally {
      set({ loading: false })
    }
  },
  refresh: () => get().fetch(true),
}))
