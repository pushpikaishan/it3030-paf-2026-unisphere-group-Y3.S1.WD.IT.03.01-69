import { matchPath, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AppRoutes from './routes/AppRoutes'
import { useAuth } from './hooks/useAuth'

function App() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const showSidebar = pathname.startsWith('/admin') && isPrivileged
  const hideNavbarRoutes = ['/pending/technician', '/login', '/register', '/contact-admin']

  const knownRoutePatterns = [
    '/',
    '/dashboard',
    '/bookings',
    '/my-bookings',
    '/resources',
    '/resources/:id',
    '/tickets',
    '/restoration',
    '/profile',
    '/admin',
    '/admin/dashboard',
    '/admin/resources',
    '/admin/bookings',
    '/admin/tickets',
    '/admin/users',
    '/admin/notifications',
    '/admin/profile',
    '/admin/manager-area',
    '/login',
    '/register',
    '/contact-admin',
    '/pending/technician',
    '/oauth/callback',
  ]

  const isKnownRoute = knownRoutePatterns.some((pattern) =>
    Boolean(matchPath({ path: pattern, end: true }, pathname)),
  )

  const isProtectedManualPath = pathname === '/dashboard' || pathname.startsWith('/admin')
  const hideAppChromeForUnauthorized = !user && isProtectedManualPath
  const hideAppChromeForForbiddenAdmin = pathname.startsWith('/admin') && !isPrivileged
  const hideAppChrome = hideAppChromeForUnauthorized || hideAppChromeForForbiddenAdmin

  const showNavbar = !hideAppChrome && !showSidebar && !hideNavbarRoutes.includes(pathname) && isKnownRoute

  return (
    <div className="layout">
      {showNavbar && <Navbar />}
      <div className={`content${showSidebar ? '' : ' no-sidebar'}`}>
        {showSidebar && <Sidebar />}
        <div className="page">
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}

export default App
