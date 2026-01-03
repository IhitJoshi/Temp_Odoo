import api from './api'

export const markAttendance = async (attendanceData) => {
  const response = await api.post('/attendance/mark', attendanceData)
  return response.data
}

export const getAttendance = async (params = {}) => {
  const response = await api.get('/attendance', { params })
  return response.data
}

export const getAttendanceStats = async (params = {}) => {
  const response = await api.get('/attendance/stats', { params })
  return response.data
}

