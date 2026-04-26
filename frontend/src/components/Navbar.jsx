import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import NotificationPanel from './NotificationPanel'
import logo from '../assets/images/unisphere.png'
import bell from '../assets/images/normelbell.png'
import activebell from '../assets/images/activebell.png'
import { announcementApi } from '../services/announcementApi'

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [roleAnnouncements, setRoleAnnouncements] = useState([])
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isTechnician = user?.role === 'TECHNICIAN'
  const onAdminPage = pathname.startsWith('/admin')
  const avatar =
    user?.profileImage || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`

  const adminNav = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/resources', label: 'Resources Management' },
    { to: '/admin/bookings', label: 'Booking Management' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/notifications', label: 'Notifications' },
  ]

  const defaultNav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/my-bookings', label: 'My Bookings' },
    { to: '/resources', label: 'Resources' },
    { to: '/tickets', label: 'Tickets' },
    ...(isTechnician ? [{ to: '/restoration', label: 'Restoration' }] : []),
  ]

  const links = isPrivileged && onAdminPage ? adminNav : defaultNav
  const brandHref = isPrivileged && onAdminPage ? '/admin/dashboard' : '/'
  useEffect(() => {
    let active = true

    const loadAnnouncements = async () => {
      if (!user) {
        if (active) setRoleAnnouncements([])
        return
      }

      try {
        const list = await announcementApi.getMyAnnouncements()
        if (!active) return
        const mapped = (Array.isArray(list) ? list : []).map((item) => ({
          id: `ann-${item.id}`,
          title: item.title || 'Announcement',
          message: item.message || '',
          attachmentUrl: item.attachmentUrl || '',
          createdAt: item.createdAt,
          type: 'announcement',
        }))
        setRoleAnnouncements(mapped)
      } catch {
        if (active) setRoleAnnouncements([])
      }
    }

    loadAnnouncements()
    return () => {
      active = false
    }
  }, [user])

  const notifications = [...roleAnnouncements, ...(user?.notifications || [])]

  // Unread notification count
  const [readMap, setReadMap] = useState(() => {
    const userKey = user?.id || user?.email || 'guest'
    const stored = localStorage.getItem(`unisphere_notification_read_${userKey}`)
    return stored ? JSON.parse(stored) : {}
  })

  useEffect(() => {
    const userKey = user?.id || user?.email || 'guest'
    const stored = localStorage.getItem(`unisphere_notification_read_${userKey}`)
    setReadMap(stored ? JSON.parse(stored) : {})
  }, [user])

  const unreadCount = notifications.filter(n => !readMap[n.id]).length

  return (
    <header className="navbar">
      <Link className="brand" to={brandHref}>
        <img className="brand-logo" src={logo} alt="UniSphere" />
        <span>UniSphere</span>
      </Link>
      <nav className="nav-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="nav-session">
        <button
          type="button"
          className="nav-bell-btn"
          onClick={() => setShowNotifications((prev) => !prev)}
          aria-label="Toggle notifications"
        >
          <img className="nav-bell" src={unreadCount > 0 ? activebell : bell} alt="Notifications" />
        </button>
        {user && (
          <Link className="nav-profile" to="/profile">
            <img className="nav-avatar" src={avatar} alt="Profile avatar" />
            <span className="nav-user">{user?.name || user?.email || 'Profile'}</span>
          </Link>
        )}
      </div>
      {showNotifications && (
        <div className="nav-notify-panel">
          <NotificationPanel items={notifications} user={user} />
        </div>
      )}
    </header>
  )
}
