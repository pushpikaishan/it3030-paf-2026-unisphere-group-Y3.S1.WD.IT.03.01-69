import { useEffect, useMemo, useState } from 'react'
import './NotificationPanel.css'
import {
  getFilteredNotifications,
  getNotificationPreferences,
  getNotificationUserKey,
  setNotificationPreference,
} from '../utils/notificationSettings'

export default function NotificationPanel({ items = [], user = null }) {
  const [showSettings, setShowSettings] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const userKey = useMemo(() => getNotificationUserKey(user), [user])
  const [preferences, setPreferences] = useState(() => getNotificationPreferences(userKey))

  useEffect(() => {
    setPreferences(getNotificationPreferences(userKey))
  }, [userKey])


  // Add read/unread state
  const [readMap, setReadMap] = useState(() => {
    const stored = localStorage.getItem(`unisphere_notification_read_${userKey}`)
    return stored ? JSON.parse(stored) : {}
  })

  useEffect(() => {
    const stored = localStorage.getItem(`unisphere_notification_read_${userKey}`)
    setReadMap(stored ? JSON.parse(stored) : {})
  }, [userKey])

  const notifications = useMemo(() => {
    const notifs = getFilteredNotifications(userKey, items)
    // Sort newest first
    return [...notifs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [userKey, items, preferences])

  const markAsRead = (id) => {
    const next = { ...readMap, [id]: true }
    setReadMap(next)
    localStorage.setItem(`unisphere_notification_read_${userKey}` , JSON.stringify(next))
  }

  const markAllAsRead = () => {
    const next = {}
    notifications.forEach(n => { next[n.id] = true })
    setReadMap(next)
    localStorage.setItem(`unisphere_notification_read_${userKey}` , JSON.stringify(next))
  }

  // Time ago helper
  function timeAgo(dateString) {
    if (!dateString) return ''
    const now = new Date()
    const date = new Date(dateString)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)} min ago`
    if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`
    return date.toLocaleDateString()
  }

  const togglePreference = (key) => {
    const next = setNotificationPreference(userKey, key, !preferences[key])
    setPreferences(next)
  }

  const summarize = (text, max = 120) => {
    if (!text) return ''
    const normalized = String(text).replace(/\s+/g, ' ').trim()
    if (normalized.length <= max) return normalized
    return `${normalized.slice(0, max)}...`
  }

  const ToggleRow = ({ title, prefKey }) => (
    <div className="notify-setting-row">
      <span>{title}</span>
      <button
        type="button"
        className={`notify-toggle-switch ${preferences[prefKey] ? 'is-on' : ''}`}
        onClick={() => togglePreference(prefKey)}
        aria-pressed={Boolean(preferences[prefKey])}
        aria-label={`${title} ${preferences[prefKey] ? 'enabled' : 'disabled'}`}
      >
        <span className="notify-toggle-thumb" />
      </button>
    </div>
  )

  return (
    <div className="card notification-panel-card">

      <div className="notify-header-row">
        <h3>Notifications</h3>
        <button
          type="button"
          className="notify-read-all-btn"
          onClick={markAllAsRead}
          title="Mark all as read"
        >
          <span>Read all</span>
        </button>
        <button
          type="button"
          className="notify-gear-btn"
          onClick={() => setShowSettings((prev) => !prev)}
          aria-label="Open notification settings"
          title="Notification settings"
        >
          <svg viewBox="0 0 24 24" className="notify-gear-icon" aria-hidden="true">
            <path d="M19.14 12.94a7.96 7.96 0 0 0 .06-.94 7.96 7.96 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.63l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.52 7.52 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.57.22-1.11.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.85a.5.5 0 0 0 .12.63l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.63l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.52.41 1.06.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.57-.22 1.11-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.63l-2.03-1.58ZM12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Z" />
          </svg>
        </button>
      </div>

      {showSettings && (
        <div className="notify-settings">
          <ToggleRow title="Security Notifications" prefKey="security" />
          <ToggleRow title="Booking Notifications" prefKey="bookings" />
          <ToggleRow title="Ticket Notifications" prefKey="tickets" />
          <ToggleRow title="Account Notifications" prefKey="account" />
        </div>
      )}

      {notifications.length === 0 && <p className="muted">No notifications yet.</p>}

      <ul className="list notify-list">
        {notifications.map((n) => {
          const isRead = !!readMap[n.id]
          return (
            <li key={n.id} className={`notify-list-item${!isRead ? ' unread' : ''}`}>
              <button
                type="button"
                className="notify-item-btn"
                onClick={() => { setSelectedNotification(n); markAsRead(n.id) }}
                aria-label={`Open notification ${n.title || 'details'}`}
                style={{ position: 'relative', width: '100%', textAlign: 'left' }}
              >
                <div className="list-title notify-item-title">
                  {n.title}
                </div>
                <div className="muted notify-item-message">{summarize(n.message)}</div>
                <span className="notify-time-ago">{timeAgo(n.createdAt)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {selectedNotification && (
        <div className="support-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="support-modal-card notify-detail-card" onClick={(event) => event.stopPropagation()}>
            <h3>{selectedNotification.title || 'Notification'}</h3>
            <p className="notify-detail-message">{selectedNotification.message || '-'}</p>

            {selectedNotification.attachmentUrl && (
              <a
                className="notify-attachment-link"
                href={selectedNotification.attachmentUrl}
                target="_blank"
                rel="noreferrer"
              >
                View attachment
              </a>
            )}

            <div className="support-modal-actions">
              <button type="button" className="ghost" onClick={() => setSelectedNotification(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
