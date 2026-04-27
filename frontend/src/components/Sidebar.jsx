import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar() {
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isManager = user?.role === 'MANAGER'

  if (!isPrivileged) return null

  const adminNav = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/resources', label: 'Resources Management' },
    { to: '/admin/bookings', label: 'Booking Management' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/notifications', label: 'Notifications' },
  ]

  const managerOnlyNav = isManager
    ? [
        { to: '/admin/manager-area', label: 'Manager Area' },
      ]
    : []

  const avatar = user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`

  return (
    <aside className="sidebar">
      <NavLink className="sidebar-profile" to="/admin/profile">
        <img className="sidebar-avatar" src={avatar} alt="Admin avatar" />
        <div className="sidebar-profile-text">
          <div className="sidebar-profile-name">{user?.name || 'Admin'}</div>
          {user?.email && <div className="sidebar-profile-email">{user.email}</div>}
        </div>
      </NavLink>

      {[...managerOnlyNav, ...adminNav].map((link) =>  (
        <NavLink key={link.to} to={link.to}>
          {link.label}
        </NavLink>
      ))}
    </aside>
  )
}
