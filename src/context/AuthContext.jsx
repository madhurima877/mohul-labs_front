import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await api.get('/me'))
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onLogout = () => setUser(null)
    window.addEventListener('mohul:logout', onLogout)
    return () => window.removeEventListener('mohul:logout', onLogout)
  }, [refresh])

  const login = (token, u) => {
    setToken(token)
    setUser(u)
  }
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const isStaff = Boolean(user && user.role !== 'customer')
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isStaff, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
