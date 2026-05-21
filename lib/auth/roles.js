// Role-based access definitions
export const ROLES = {
  ADMIN: 'admin',
  TU: 'tu',
  WALI_KELAS: 'wali_kelas',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  tu: 'Tata Usaha',
  wali_kelas: 'Wali Kelas',
}

export const ROLE_BADGE_COLOR = {
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  tu: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  wali_kelas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
}

// Define which roles can access which routes
export const ROUTE_ACCESS = {
  '/dashboard': ['admin', 'tu', 'wali_kelas'],
  '/siswa': ['admin', 'tu', 'wali_kelas'],
  '/guru': ['admin', 'tu'],
  '/kelas': ['admin', 'tu'],
  '/pembayaran': ['admin', 'tu'],
  '/absensi': ['admin', 'tu', 'wali_kelas'],
  '/surat': ['admin', 'tu'],
  '/settings': ['admin'],
}

export function canAccess(role, path) {
  const allowed = ROUTE_ACCESS[path]
  if (!allowed) return true
  return allowed.includes(role)
}
