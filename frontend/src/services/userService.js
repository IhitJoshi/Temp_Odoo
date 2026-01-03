import api from './api'

export const getProfile = async () => {
  const response = await api.get('/user/profile')
  return response.data
}

export const updateProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData)
  return response.data
}

export const uploadProfileImage = async (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await api.post('/user/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

