import api from './api'

export const announcementApi = {
  getAdminAnnouncements: async () => {
    const { data } = await api.get('/announcements')
    return data
  },
  getMyAnnouncements: async () => {
    const { data } = await api.get('/announcements/me')
    return data
  },
  createAnnouncement: async ({ targetRole, title, message, attachment }) => {
    const formData = new FormData()
    formData.append('targetRole', targetRole)
    if (title?.trim()) formData.append('title', title.trim())
    formData.append('message', message.trim())
    if (attachment) formData.append('attachment', attachment)

    const { data } = await api.post('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
