import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as loginApi, logout as logoutApi } from '../api/auth'

const AuthContext = createContext(null)

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch { return null }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [sessionWarning, setSessionWarning] = useState(false)
  const warnTimerRef   = useRef(null)
  const expireTimerRef = useRef(null)

  const clearTimers = () => {
    if (warnTimerRef.current)   clearTimeout(warnTimerRef.current)
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current)
  }

  const scheduleSessionTimers = (expiresAt) => {
    clearTimers()
    if (!expiresAt) return
    const now = Date.now()
    const msUntilExpiry = expiresAt - now
    if (msUntilExpiry <= 0) return
    const msUntilWarn = msUntilExpiry - 5 * 60 * 1000
    if (msUntilWarn > 0) {
      warnTimerRef.current = setTimeout(() => setSessionWarning(true), msUntilWarn)
    } else {
      setSessionWarning(true)
    }
    expireTimerRef.current = setTimeout(() => logout(), msUntilExpiry)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedExpiry = localStorage.getItem('expiresAt')
    if (storedUser) {
      const expiresAt = storedExpiry ? Number(storedExpiry) : null
      if (expiresAt && Date.now() >= expiresAt) {
        // Session already expired — clean up
        localStorage.removeItem('user')
        localStorage.removeItem('expiresAt')
      } else {
        setUser(JSON.parse(storedUser))
        scheduleSessionTimers(expiresAt)
      }
    }
    setLoading(false)
    return () => clearTimers()
  }, [])

  const login = async (credentials) => {
    const response = await loginApi(credentials)
    const { token, username, role, city } = response.data
    const expiresAt = getTokenExpiry(token)
    const userData = { username, role, city }
    localStorage.setItem('user', JSON.stringify(userData))
    if (expiresAt) localStorage.setItem('expiresAt', String(expiresAt))
    setUser(userData)
    setSessionWarning(false)
    scheduleSessionTimers(expiresAt)
    return userData
  }

  const logout = () => {
    clearTimers()
    logoutApi().catch(() => {}) // clear server-side cookie
    localStorage.removeItem('user')
    localStorage.removeItem('expiresAt')
    setUser(null)
    setSessionWarning(false)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    sessionWarning,
    dismissWarning: () => setSessionWarning(false),
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    userCity: user?.city || null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
