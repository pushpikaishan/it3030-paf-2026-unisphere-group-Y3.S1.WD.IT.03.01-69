import api from './api'

export const notificationApi = {
  getMyNotifications: async () => {
    const { data } = await api.get('/notifications/me')
    return Array.isArray(data) ? data : []
  },
}
