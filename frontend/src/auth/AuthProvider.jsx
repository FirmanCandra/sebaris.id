import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Admin auth state (for /admin panel)
  const [token, setToken] = useState(() => localStorage.getItem('sebaris.admin.token'))
  const [admin, setAdmin] = useState(null)
  const [adminReady, setAdminReady] = useState(false)

  // Public User auth state (voters/pemilih via Google)
  const [userToken, setUserToken] = useState(() => localStorage.getItem('sebaris.user.token'))
  const [user, setUser] = useState(null)
  const [userVotes, setUserVotes] = useState([])
  const [userReady, setUserReady] = useState(false)

  // Check admin session
  useEffect(() => {
    if (!token) {
      setAdminReady(true)
      return
    }

    api('/admin/me', { token })
      .then(({ data }) => setAdmin(data))
      .catch(() => {
        localStorage.removeItem('sebaris.admin.token')
        setToken(null)
        setAdmin(null)
      })
      .finally(() => setAdminReady(true))
  }, [token])

  // Check user session
  const loadUserData = useCallback(async (uToken) => {
    const activeToken = uToken || userToken
    if (!activeToken) {
      setUser(null)
      setUserReady(true)
      return
    }
    try {
      const res = await api('/user/me', { token: activeToken })
      setUser(res.data)
    } catch {
      localStorage.removeItem('sebaris.user.token')
      setUserToken(null)
      setUser(null)
    } finally {
      setUserReady(true)
    }
  }, [userToken])

  const loadUserVotes = useCallback(async () => {
    if (!userToken) {
      setUserVotes([])
      return
    }
    try {
      const res = await api('/user/votes', { token: userToken })
      setUserVotes(res.data || [])
    } catch {
      setUserVotes([])
    }
  }, [userToken])

  useEffect(() => {
    loadUserData()
    loadUserVotes()
  }, [loadUserData, loadUserVotes])

  // Universal Login (Email + Password) - automatically handles Admin or User
  async function login(credentials) {
    const payload = await api('/auth/login', { method: 'POST', body: credentials })
    const role = payload.role || 'user'
    const userData = payload.user?.data || payload.user

    if (role === 'admin' || role === 'superadmin') {
      localStorage.setItem('sebaris.admin.token', payload.token)
      setAdmin(userData)
      setToken(payload.token)
    } else {
      localStorage.setItem('sebaris.user.token', payload.token)
      setUser(userData)
      setUserToken(payload.token)
      api('/user/votes', { token: payload.token })
        .then((res) => setUserVotes(res.data || []))
        .catch(() => {})
    }

    return payload
  }

  // User manual registration
  async function register(data) {
    const payload = await api('/auth/register', { method: 'POST', body: data })
    const uData = payload.user?.data || payload.user
    localStorage.setItem('sebaris.user.token', payload.token)
    setUser(uData)
    setUserToken(payload.token)
    return payload
  }

  // Universal Google Login (User or Admin, with automatic notification email)
  async function loginWithGoogle(credential) {
    const payload = await api('/auth/google-login', {
      method: 'POST',
      body: { credential },
    })
    const role = payload.role || 'user'
    const userData = payload.user?.data || payload.user

    if (role === 'admin' || role === 'superadmin') {
      localStorage.setItem('sebaris.admin.token', payload.token)
      setAdmin(userData)
      setToken(payload.token)
    } else {
      localStorage.setItem('sebaris.user.token', payload.token)
      setUser(userData)
      setUserToken(payload.token)
      api('/user/votes', { token: payload.token })
        .then((res) => setUserVotes(res.data || []))
        .catch(() => {})
    }

    return payload
  }

  // Admin logout
  async function logout() {
    if (token) {
      try {
        await api('/admin/logout', { method: 'POST', token })
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('sebaris.admin.token')
    setAdmin(null)
    setToken(null)
  }

  // Public User logout
  async function logoutUser() {
    if (userToken) {
      try {
        await api('/user/logout', { method: 'POST', token: userToken })
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('sebaris.user.token')
    setUser(null)
    setUserToken(null)
    setUserVotes([])
  }

  return (
    <AuthContext.Provider
      value={{
        // Auth state
        token,
        admin,
        ready: adminReady,
        login,
        register,
        loginWithGoogle,
        logout,
        // Public User Auth
        userToken,
        user,
        userReady,
        userVotes,
        loginUserWithGoogle: loginWithGoogle,
        logoutUser,
        loadUserVotes,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useUserAuth() {
  const { userToken, user, userReady, userVotes, loginUserWithGoogle, logoutUser, loadUserVotes } = useContext(AuthContext)
  return { userToken, user, userReady, userVotes, loginUserWithGoogle, logoutUser, loadUserVotes }
}

