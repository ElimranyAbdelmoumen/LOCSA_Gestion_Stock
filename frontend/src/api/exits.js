import api from './axios'

export const getExits = (city, dateFrom, dateTo, page = 0, size = 20) => {
  const params = { page, size }
  if (city) params.city = city
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo
  return api.get('/exits', { params })
}
export const createExit = (data) => api.post('/exits', data)
export const deleteExit = (id) => api.delete(`/exits/${id}`)
