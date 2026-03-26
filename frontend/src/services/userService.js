import api from './api'

export const userService = {
  register: async (payload) => {
    const { data } = await api.post('/users', payload)
    return data
  },
  login: async (payload) => {
    try {
      const { data } = await api.post('/auth/login', payload)
      return data
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
}
