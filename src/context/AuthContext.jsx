import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getSession, setSession } from '../api'

const AuthContext = createContext(null)

// While the staff portal is open its token is swapped for a fresh one on this interval, so a counter
// stays logged in for the whole shift. A closed tab simply lets the token expire (STAFF_JWT_TTL).
const STAFF_REFRESH_MS = 15 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [portal, setPortal] = useState(() => getSession()?.portal || null)
  const [loading, setLoading] = useState(Boolean(getSession()))

  const refresh = useCallback(async () => {
    if (!getSession()) {
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
    const onLogout = () => { setUser(null); setPortal(null) }
    window.addEventListener('mohul:logout', onLogout)
    return () => window.removeEventListener('mohul:logout', onLogout)
  }, [refresh])

  useEffect(() => {
    if (portal !== 'staff' || !user) return undefined
    const renew = async () => {
      try {
        const res = await api.post('/auth/refresh')
        setSession(res.access_token, 'staff')
      } catch { /* a 401 logs out via the api client; network blips just retry next time */ }
    }
    renew()
    const id = setInterval(renew, STAFF_REFRESH_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') renew() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [portal, user])

  const login = (token, u, p = 'customer') => {
    setSession(token, p)
    setPortal(p)
    setUser(u)
  }
  const logout = () => {
    setSession(null)
    setPortal(null)
    setUser(null)
  }

  const isStaff = Boolean(user && user.role !== 'customer')
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isStaff, portal, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
