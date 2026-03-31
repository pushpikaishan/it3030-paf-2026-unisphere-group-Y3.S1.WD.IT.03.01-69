import { createContext, useEffect, useState } from 'react'
import { userService } from '../services/userService'

export const AuthContext = createContext(null)

const decodeToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    return JSON.parse(atob(payload))
  } catch (e) {
    return null
  }
}

const extractRole = (role, authorities) => {
  if (role) return role
  const primary = authorities?.find((auth) => auth?.startsWith('ROLE_'))
  return primary ? primary.replace('ROLE_', '') : undefined
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
        const email = me?.email || tokenClaims?.email
        const profileImage = me?.profileImage || me?.picture || tokenClaims?.picture

        setUser({ ...me, role, id, name, email, profileImage })
      } else {
        // Fallback to token claims so the session survives brief /me issues
        if (tokenClaims) {
          setUser({
            role: tokenClaims.role,
            id: tokenClaims.id,
            name: tokenClaims.name,
            email: tokenClaims.email,
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
          role: tokenClaims.role,
          id: tokenClaims.id,
          name: tokenClaims.name,
          email: tokenClaims.email,
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
    setUser(data)
    setLoading(false)
    return data
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
