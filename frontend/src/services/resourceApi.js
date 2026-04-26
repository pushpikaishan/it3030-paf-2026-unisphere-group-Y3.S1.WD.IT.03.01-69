import api from './api'

export const resourceApi = {
  getResources: async (params = {}) => {
    const { data } = await api.get('/resources', { params })
    return data
  },
  getResourceById: async (id) => {
    const { data } = await api.get(`/resources/${id}`)
    return data
  },
  getResourceTypes: async () => {
    const { data } = await api.get('/resources/types')
    return data
  },
  createResource: async (payload) => {
    const { data } = await api.post('/resources', payload)
    return data
  },
  updateResource: async (id, payload) => {
    const { data } = await api.put(`/resources/${id}`, payload)
    return data
  },
  deleteResource: async (id) => {
    await api.delete(`/resources/${id}`)
  },
  updateResourceStatus: async (id, status) => {
    const { data } = await api.patch(`/resources/${id}/status`, { status })
    return data
  },
}
