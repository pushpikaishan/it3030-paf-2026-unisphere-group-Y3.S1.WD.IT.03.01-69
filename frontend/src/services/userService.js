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
      return data
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
  sendForgotPasswordCode: async ({ email }) => {
    try {
      const { data } = await api.post('/auth/forgot-password/send-code', { email })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not send password reset code'
      throw new Error(message)
    }
  },
  verifyForgotPasswordCode: async ({ email, code }) => {
    try {
      const { data } = await api.post('/auth/forgot-password/verify-code', { email, code })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not verify password reset code'
      throw new Error(message)
    }
  },
  resetForgotPassword: async ({ email, code, newPassword }) => {
    try {
      const { data } = await api.post('/auth/forgot-password/reset', { email, code, newPassword })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not reset password'
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
      const headers = payload?.twoFactorToken ? { 'X-2FA-Token': payload.twoFactorToken } : undefined
      const { twoFactorToken, ...body } = payload || {}
      const { data } = await api.put(`/users/${id}`, body, headers ? { headers } : undefined)
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
  disable: async (id, options = {}) => {
    if (!id) throw new Error('Missing user id')
    try {
      const headers = options?.twoFactorToken ? { 'X-2FA-Token': options.twoFactorToken } : undefined
      const { data } = await api.post(`/users/${id}/disable`, null, headers ? { headers } : undefined)
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Disable failed'
      throw new Error(message)
    }
  },
  sendLoginTwoFactorCode: async ({ challengeId, method }) => {
    try {
      const { data } = await api.post('/auth/2fa/send-code', { challengeId, method })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not send login verification code'
      throw new Error(message)
    }
  },
  verifyLoginTwoFactorCode: async ({ challengeId, method, code }) => {
    try {
      const { data } = await api.post('/auth/2fa/verify', { challengeId, method, code })
      if (data?.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not verify login code'
      throw new Error(message)
    }
  },
  startProtectedActionChallenge: async (action) => {
    try {
      const { data } = await api.post('/security/2fa/challenge/start', { action })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not start two-factor challenge'
      throw new Error(message)
    }
  },
  sendProtectedActionCode: async ({ challengeId, method }) => {
    try {
      const { data } = await api.post('/security/2fa/challenge/send-code', { challengeId, method })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not send challenge code'
      throw new Error(message)
    }
  },
  verifyProtectedActionCode: async ({ challengeId, method, code }) => {
    try {
      const { data } = await api.post('/security/2fa/challenge/verify', { challengeId, method, code })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not verify challenge code'
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
  setupAuthenticatorApp: async () => {
    try {
      const { data } = await api.post('/security/2fa/app/setup')
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not prepare authenticator setup'
      throw new Error(message)
    }
  },
  verifyAuthenticatorApp: async (otpCode) => {
    try {
      const { data } = await api.post('/security/2fa/app/verify', { otpCode })
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not verify authenticator code'
      throw new Error(message)
    }
  },
  disableEmailTwoFactor: async () => {
    try {
      const { data } = await api.post('/security/2fa/email/disable')
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not disable email two-factor'
      throw new Error(message)
    }
  },
  disableAuthenticatorApp: async () => {
    try {
      const { data } = await api.post('/security/2fa/app/disable')
      return data
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not disable authenticator app'
      throw new Error(message)
    }
  },
}
