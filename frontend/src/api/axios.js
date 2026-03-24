import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly jwt cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
