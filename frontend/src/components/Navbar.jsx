import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import NotificationPanel from './NotificationPanel'
import logo from '../assets/images/unisphere.png'
import bell from '../assets/images/normelbell.png'

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false)
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
    { to: '/resources', label: 'Resources' },
    { to: '/tickets', label: 'Tickets' },
    ...(isTechnician ? [{ to: '/restoration', label: 'Restoration' }] : []),
    ...(isPrivileged ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  const links = isPrivileged && onAdminPage ? adminNav : defaultNav
  const brandHref = isPrivileged && onAdminPage ? '/admin/dashboard' : '/'
  const notifications = user?.notifications || []

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
          <img className="nav-bell" src={bell} alt="Notifications" />
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
          <NotificationPanel items={notifications} />
        </div>
      )}
    </header>
  )
}
