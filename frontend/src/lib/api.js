const API_BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || res.statusText)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  me: () => request('/me'),
  users: {
    list: () => request('/users'),
    create: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: (userId) => request(`/notifications${userId ? `?userId=${userId}` : ''}`),
    create: (payload, userId) =>
      request(`/notifications${userId ? `?userId=${userId}` : ''}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id, payload, userId) =>
      request(`/notifications/${id}${userId ? `?userId=${userId}` : ''}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  },
}
