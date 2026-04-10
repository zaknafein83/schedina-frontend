import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'))

  const fetchMe = useCallback(async (tkn) => {
    try {
      const res = await authApi.me()
      setUser(res.data)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      fetchMe(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [fetchMe])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    const { accessToken } = res.data
    localStorage.setItem('token', accessToken)
    setToken(accessToken)
    const meRes = await authApi.me()
    setUser(meRes.data)
    return meRes.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
