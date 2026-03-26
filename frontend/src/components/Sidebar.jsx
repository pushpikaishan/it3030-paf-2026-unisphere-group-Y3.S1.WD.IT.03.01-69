import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/bookings">Bookings</NavLink>
      <NavLink to="/resources">Resources</NavLink>
      <NavLink to="/tickets">Tickets</NavLink>
      <NavLink to="/admin">Admin</NavLink>
    </aside>
  )
}
