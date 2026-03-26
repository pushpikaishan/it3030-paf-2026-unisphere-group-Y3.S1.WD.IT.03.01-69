import { Link } from 'react-router-dom'

export default function Navbar() {

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        UniSphere
      </Link>
      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/bookings">Bookings</Link>
        <Link to="/resources">Resources</Link>
        <Link to="/tickets">Tickets</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <div className="nav-session"></div>
    </header>
  )
}
