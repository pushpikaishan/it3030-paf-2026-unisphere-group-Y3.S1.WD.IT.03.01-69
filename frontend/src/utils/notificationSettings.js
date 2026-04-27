const DEFAULT_PREFERENCES = {
  security: true,
  tickets: true,
  bookings: true,
  account: true,
}

const settingsKey = (userKey) => `unisphere_notification_settings_${userKey || 'guest'}`
const notificationsKey = (userKey) => `unisphere_notifications_${userKey || 'guest'}`

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const getNotificationUserKey = (user) => String(user?.id || user?.email || 'guest')

export const getNotificationPreferences = (userKey) => ({
  ...DEFAULT_PREFERENCES,
  ...readJson(settingsKey(userKey), {}),
})

export const setNotificationPreference = (userKey, key, enabled) => {
  const current = getNotificationPreferences(userKey)
  const updated = {
    ...current,
    [key]: Boolean(enabled),
  }
  writeJson(settingsKey(userKey), updated)
  return updated
}

const isNotificationEnabled = (prefs, notification) => {
  const category = notification?.category

  if (category === 'security') {
    return prefs.security
  }

  if (category === 'account') {
    return prefs.account
  }

  if (category === 'tickets') return prefs.tickets
  if (category === 'bookings') return prefs.bookings

  return true
}

export const getStoredNotifications = (userKey) => {
  const value = readJson(notificationsKey(userKey), [])
  return Array.isArray(value) ? value : []
}

export const getFilteredNotifications = (userKey, items = []) => {
  const prefs = getNotificationPreferences(userKey)
  const stored = getStoredNotifications(userKey)
  const merged = [...stored, ...items]
  return merged.filter((notification) => isNotificationEnabled(prefs, notification))
}

export const addNotification = (userKey, notification) => {
  const prefs = getNotificationPreferences(userKey)
  if (!isNotificationEnabled(prefs, notification)) return null

  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    category: notification?.category,
    type: notification?.type,
    title: notification?.title || 'Notification',
    message: notification?.message || '',
  }

  const existing = getStoredNotifications(userKey)
  const next = [entry, ...existing].slice(0, 40)
  writeJson(notificationsKey(userKey), next)
  return entry
}
