import api from './axios'

export const login = (credentials) => api.post('/auth/login', credentials)
export const register = (userData) => api.post('/auth/register', userData)
