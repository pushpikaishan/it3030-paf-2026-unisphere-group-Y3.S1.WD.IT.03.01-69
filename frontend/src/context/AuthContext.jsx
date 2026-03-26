import { createContext, useEffect, useState } from 'react'
import { userService } from '../services/userService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const me = await userService.me()
      if (me?.authenticated) {
        setUser(me)
      } else {
        setUser(null)
      }
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const register = async (payload) => {
    const data = await userService.register(payload)
    setUser(data)
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
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
