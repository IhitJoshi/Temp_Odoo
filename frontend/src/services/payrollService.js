import api from './api'

export const generatePayroll = async (payrollData) => {
  const response = await api.post('/payroll/generate', payrollData)
  return response.data
}

export const getPayroll = async (params = {}) => {
  const response = await api.get('/payroll', { params })
  return response.data
}

export const getPayrollById = async (id) => {
  const response = await api.get(`/payroll/${id}`)
  return response.data
}

export const lockPayroll = async (id) => {
  const response = await api.put(`/payroll/lock/${id}`)
  return response.data
}

