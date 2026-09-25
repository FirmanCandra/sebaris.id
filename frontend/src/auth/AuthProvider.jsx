import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sebaris.admin.token'))
  const [admin, setAdmin] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!token) {
      setReady(true)
      return
    }

    api('/admin/me', { token })
      .then(({ data }) => setAdmin(data))
      .catch(() => {
        localStorage.removeItem('sebaris.admin.token')
        setToken(null)
      })
      .finally(() => setReady(true))
  }, [token])

  async function login(credentials) {
    const payload = await api('/admin/login', { method: 'POST', body: credentials })
    localStorage.setItem('sebaris.admin.token', payload.token)
    setAdmin(payload.admin.data)
    setToken(payload.token)
  }

  async function logout() {
    if (token) await api('/admin/logout', { method: 'POST', token })
    localStorage.removeItem('sebaris.admin.token')
    setAdmin(null)
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, admin, ready, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
