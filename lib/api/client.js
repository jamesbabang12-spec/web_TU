import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('sekolahku-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const token = parsed?.state?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
    } catch {}
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      const path = window.location.pathname
      if (path !== '/' && !path.startsWith('/api')) {
        localStorage.removeItem('sekolahku-auth')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)
