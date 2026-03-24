import api from './axios'

export const getEntries = (city, dateFrom, dateTo, page = 0, size = 20) => {
  const params = { page, size }
  if (city) params.city = city
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo
  return api.get('/entries', { params })
}
export const createEntry = (data) => api.post('/entries', data)
export const deleteEntry = (id) => api.delete(`/entries/${id}`)
