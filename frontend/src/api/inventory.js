import api from './axios'

export const getInventories = () => api.get('/inventory')
export const createInventory = (data) => api.post('/inventory', data)
export const adjustStock = (id, adjustmentComment) => api.post(`/inventory/${id}/adjust`, { adjustmentComment })
