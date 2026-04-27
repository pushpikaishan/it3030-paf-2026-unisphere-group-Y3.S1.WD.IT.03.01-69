import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

const readValidToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded))
    const expMs = claims?.exp ? claims.exp * 1000 : null

    if (expMs && expMs <= Date.now()) {
      localStorage.removeItem('token')
      return null
    }

    return token
  } catch {
    localStorage.removeItem('token')
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = readValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  },
)

export default api
