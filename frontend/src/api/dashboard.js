import api from './axios'

export const getDashboard = () => api.get('/dashboard')
export const getDashboardStats = (period) => api.get(`/dashboard/stats?period=${period}`)
