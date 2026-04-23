import api from './api'

export const userService = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    if (data?.token) {
      localStorage.setItem('token', data.token)
    }
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
      const raw = err?.response?.data?.message || err?.response?.data || 'Login failed'
      const normalized = raw?.toLowerCase() || ''
      const message = normalized.includes('pending')
        ? 'Your account is awaiting admin approval.'
        : normalized.includes('rejected')
          ? 'Your account was temporarily rejected. Please contact an administrator.'
          : normalized.includes('disabled')
            ? 'Your account is disabled. Please contact an administrator to reactivate.'
            : raw
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
  uploadAvatar: async (id, file) => {
    if (!id) throw new Error('Missing user id')
    if (!file) throw new Error('Missing file')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Image upload failed'
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
  disable: async (id) => {
    if (!id) throw new Error('Missing user id')
    try {
      const { data } = await api.post(`/users/${id}/disable`)
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Disable failed'
      throw new Error(message)
    }
  },
  getTwoFactorStatus: async () => {
    try {
      const { data } = await api.get('/security/2fa/status')
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not load two-factor status'
      throw new Error(message)
    }
  },
  sendEmailOtp: async () => {
    try {
      const { data } = await api.post('/security/2fa/email/send-otp')
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not send OTP code'
      throw new Error(message)
    }
  },
  verifyEmailOtp: async (otpCode) => {
    try {
      const { data } = await api.post('/security/2fa/email/verify', { otpCode })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not verify OTP code'
      throw new Error(message)
    }
  },
}
