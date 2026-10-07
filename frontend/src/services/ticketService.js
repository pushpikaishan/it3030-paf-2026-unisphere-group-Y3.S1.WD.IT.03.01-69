import api from './api'

export const ticketService = {
  list: async (params = {}) => {
    // Filter out invalid/empty filter values
    const cleanParams = {}
    
    if (params.status && params.status !== 'ALL' && params.status !== '') {
      cleanParams.status = params.status
    }
    if (params.priority && params.priority !== 'ALL' && params.priority !== '') {
      cleanParams.priority = params.priority
    }
    
    // Keep any other params that were passed
    Object.keys(params).forEach(key => {
      if (key !== 'status' && key !== 'priority') {
        cleanParams[key] = params[key]
      }
    })
    
    const { data } = await api.get('/tickets', { params: cleanParams })
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/tickets/${id}`)
    return data
  },

  create: async ({ payload, attachments = [] }) => {
    const formData = new FormData()
    formData.append(
      'payload',
      new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      }),
    )

    attachments.forEach((file) => {
      formData.append('attachments', file)
    })

    const { data } = await api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/tickets/${id}/status`, payload)
    return data
  },

  assignTechnician: async (id, technicianId) => {
    const { data } = await api.patch(`/tickets/${id}/assign`, { technicianId })
    return data
  },

  addComment: async (ticketId, message) => {
    const { data } = await api.post(`/tickets/${ticketId}/comments`, { message })
    return data
  },

  updateComment: async (ticketId, commentId, message) => {
    const { data } = await api.put(`/tickets/${ticketId}/comments/${commentId}`, { message })
    return data
  },

  deleteComment: async (ticketId, commentId) => {
    await api.delete(`/tickets/${ticketId}/comments/${commentId}`)
  },
}