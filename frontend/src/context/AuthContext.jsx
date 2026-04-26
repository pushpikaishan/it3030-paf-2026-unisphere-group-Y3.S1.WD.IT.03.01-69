import { createContext, useEffect, useState } from 'react'
import { userService } from '../services/userService'

export const AuthContext = createContext(null)

const decodeToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded))
    const expMs = claims?.exp ? claims.exp * 1000 : null
    if (expMs && expMs <= Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    return claims
  } catch (e) {
    localStorage.removeItem('token')
    return null
  }
}

const normalizeRole = (value) => {
  if (!value || typeof value !== 'string') return undefined
  return value.startsWith('ROLE_') ? value.replace('ROLE_', '') : value
}

const extractRole = (role, authorities) => {
  const normalizedRole = normalizeRole(role)
  if (normalizedRole) return normalizedRole
  const primary = authorities?.find((auth) => auth?.startsWith('ROLE_'))
  return normalizeRole(primary)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const tokenClaims = decodeToken()
    try {
      const me = await userService.me()
      if (me?.authenticated) {
        const role = extractRole(me?.role, me?.authorities) || tokenClaims?.role
        const id = me?.id || tokenClaims?.id
        const name = me?.name || tokenClaims?.name
        const email = me?.email || tokenClaims?.email || tokenClaims?.sub
        const profileImage = me?.profileImage || me?.picture || tokenClaims?.picture

        setUser({ ...me, role, id, name, email, profileImage })
      } else {
        // Fallback to token claims so the session survives brief /me issues
        if (tokenClaims) {
          setUser({
            role: normalizeRole(tokenClaims.role),
            id: tokenClaims.id,
            name: tokenClaims.name,
            email: tokenClaims.email || tokenClaims.sub,
            profileImage: tokenClaims.picture,
          })
        } else {
          setUser(null)
        }
      }
    } catch (e) {
      // If the backend is temporarily unreachable but we still have a token,
      // keep a minimal user so the UI (e.g., navbar avatar) doesn't disappear.
      if (tokenClaims) {
        setUser({
          role: normalizeRole(tokenClaims.role),
          id: tokenClaims.id,
          name: tokenClaims.name,
          email: tokenClaims.email || tokenClaims.sub,
          profileImage: tokenClaims.picture,
        })
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const register = async (payload) => {
    const data = await userService.register(payload)
    if (data?.token && data?.user) {
      setUser(data.user)
    } else {
      setUser(null)
    }
    return data
  }

  const login = async (payload) => {
    const data = await userService.login(payload)
    if (data?.twoFactorRequired) {
      setLoading(false)
      return data
    }
    // After login, refresh to pull latest profile (including profileImage) from /me
    await refresh()
    setLoading(false)
    return data?.user || data
  }

  const logout = async () => {
    await userService.logout()
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
