import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('w2r_token'))
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('w2r_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const accessToken = res.data.access_token
    localStorage.setItem('w2r_token', accessToken)
    setToken(accessToken)
    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    setUser(userRes.data)
    return userRes.data
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    // Auto-login after registration
    const loginRes = await api.post('/auth/login', {
      email: data.email,
      password: data.password,
    })
    const accessToken = loginRes.data.access_token
    localStorage.setItem('w2r_token', accessToken)
    setToken(accessToken)
    setUser(res.data)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('w2r_token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      // ignore
    }
  }

  const isAdmin = user?.role && ['admin', 'super_admin', 'verification_admin', 'moderation_admin', 'support_admin'].includes(user.role)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
