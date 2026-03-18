import api from './axios'

export const getEntries = () => api.get('/entries')
export const createEntry = (data) => api.post('/entries', data)
