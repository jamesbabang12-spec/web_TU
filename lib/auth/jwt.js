import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET || 'fallback-secret'

export const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '7d' })

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export const hashPassword = async (password) => bcrypt.hash(password, 10)
export const comparePassword = async (password, hash) => bcrypt.compare(password, hash)

export function getAuthFromRequest(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyToken(token)
}

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

export function requireRole(user, allowedRoles) {
  if (!user) return false
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(user.role)
}
