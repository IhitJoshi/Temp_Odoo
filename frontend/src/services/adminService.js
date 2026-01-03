import api from './api'

export const createUser = async (userData) => {
  const response = await api.post('/admin/create-user', userData)
  return response.data
}

export const getEmployees = async (params = {}) => {
  const response = await api.get('/admin/employees', { params })
  return response.data
}

export const getEmployee = async (id) => {
  const response = await api.get(`/admin/employees/${id}`)
  return response.data
}

export const updateEmployee = async (id, userData) => {
  const response = await api.put(`/admin/employees/${id}`, userData)
  return response.data
}

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/admin/employees/${id}`)
  return response.data
}

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard')
  return response.data
}

