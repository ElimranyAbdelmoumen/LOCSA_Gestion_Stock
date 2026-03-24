import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as loginApi } from '../api/auth'

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
  const [sessionWarning, setSessionWarning] = useState(false) // shows 5-min warning banner
  const warnTimerRef   = useRef(null)
  const expireTimerRef = useRef(null)

  const clearTimers = () => {
    if (warnTimerRef.current)   clearTimeout(warnTimerRef.current)
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current)
  }

  const scheduleSessionTimers = (token) => {
    clearTimers()
    const expiry = getTokenExpiry(token)
    if (!expiry) return
    const now = Date.now()
    const msUntilExpiry = expiry - now
    if (msUntilExpiry <= 0) return
    const msUntilWarn = msUntilExpiry - 5 * 60 * 1000 // warn 5 min before
    if (msUntilWarn > 0) {
      warnTimerRef.current = setTimeout(() => setSessionWarning(true), msUntilWarn)
    } else {
      setSessionWarning(true) // already within warning window
    }
    expireTimerRef.current = setTimeout(() => {
      logout()
    }, msUntilExpiry)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      scheduleSessionTimers(token)
    }
    setLoading(false)
    return () => clearTimers()
  }, [])

  const login = async (credentials) => {
    const response = await loginApi(credentials)
    const { token, username, role, city } = response.data
    localStorage.setItem('token', token)
    const userData = { username, role, city }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setSessionWarning(false)
    scheduleSessionTimers(token)
    return userData
  }

  const logout = () => {
    clearTimers()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
