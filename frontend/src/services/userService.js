import api from './api'

export const userService = {
  register: async (payload) => {
    const { data } = await api.post('/users', payload)
    return data
  },
  login: async (payload) => {
    try {
      const { data } = await api.post('/auth/login', payload)
      if (data?.token) {
        localStorage.setItem('token', data.token)
      }
      return data?.user
    } catch (err) {
      const message = err?.response?.data?.message || 'Login failed'
      throw new Error(message)
    }
  },
  me: async () => {
    const { data } = await api.get('/me')
    return data
  },
  logout: async () => {
    // No server-side session in this flow
  },
  update: async (id, payload) => {
    if (!id) throw new Error('Missing user id')
    try {
      const { data } = await api.put(`/users/${id}`, payload)
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Update failed'
      throw new Error(message)
    }
  },
  delete: async (id) => {
    if (!id) throw new Error('Missing user id')
    try {
      await api.delete(`/users/${id}`)
    } catch (err) {
      const message = err?.response?.data?.message || 'Delete failed'
      throw new Error(message)
    }
  },
}
