export const getToken = () => localStorage.getItem('token')

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  try {
    // Basic check: JWT has 3 parts
    const parts = token.split('.')
    if (parts.length !== 3) return false
    // Check expiry
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return false
    }
    return true
  } catch {
    return false
  }
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
