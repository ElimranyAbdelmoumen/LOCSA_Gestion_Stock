import api from './axios'

export const getExits = () => api.get('/exits')
export const createExit = (data) => api.post('/exits', data)
