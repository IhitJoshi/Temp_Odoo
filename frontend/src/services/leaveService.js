import api from './api'

export const applyLeave = async (leaveData) => {
  const response = await api.post('/leave/apply', leaveData)
  return response.data
}

export const getLeaves = async (params = {}) => {
  const response = await api.get('/leave', { params })
  return response.data
}

export const approveLeave = async (id, status, rejectionReason = '') => {
  const response = await api.put(`/leave/approve/${id}`, { status, rejectionReason })
  return response.data
}

export const getLeaveStats = async (params = {}) => {
  const response = await api.get('/leave/stats', { params })
  return response.data
}

