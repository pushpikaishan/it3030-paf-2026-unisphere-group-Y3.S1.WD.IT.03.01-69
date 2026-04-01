import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/images/unisphere.png'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
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
    ...(isPrivileged ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  const links = isPrivileged && onAdminPage ? adminNav : defaultNav
  const brandHref = isPrivileged && onAdminPage ? '/admin/dashboard' : '/'

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
        {user && (
          <Link className="nav-profile" to="/profile">
            <img className="nav-avatar" src={avatar} alt="Profile avatar" />
            <span className="nav-user">{user?.name || user?.email || 'Profile'}</span>
          </Link>
        )}
      </div>
    </header>
  )
}
