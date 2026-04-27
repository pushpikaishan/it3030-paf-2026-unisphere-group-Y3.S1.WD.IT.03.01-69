import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../components/Loader'
import Dashboard from '../pages/Dashboard'
import BookingPage from '../pages/BookingPage'
import ResourcePage from '../pages/ResourcePage'
import ResourceDetailPage from '../pages/ResourceDetailPage'
import TicketPage from '../pages/TicketPage'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import OAuthCallback from '../pages/OAuthCallback'
import PendingApproval from '../pages/PendingApproval'
import ContactAdmin from '../pages/ContactAdmin'
import { useAuth } from '../hooks/useAuth'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminResources from '../pages/admin/AdminResources'
import AdminBookings from '../pages/AdminBookings'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminNotifications from '../pages/admin/AdminNotifications'
import AdminProfile from '../pages/admin/AdminProfile'
import ManagerArea from '../pages/admin/ManagerArea'

export default function AppRoutes() {
  const { user, loading } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isManager = user?.role === 'MANAGER'
  const authedHome = isPrivileged ? '/admin/dashboard' : '/dashboard'

  if (loading) return <Loader />

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? authedHome : '/login'} replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bookings" element={user ? <BookingPage /> : <Navigate to="/login" replace />} />
      <Route path="/resources" element={<ResourcePage />} />
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
      <Route path="/tickets" element={<TicketPage />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={isPrivileged ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/admin/dashboard" element={isPrivileged ? <AdminDashboard /> : <Navigate to="/dashboard" replace />} />
      <Route path="/admin/resources" element={isPrivileged ? <AdminResources /> : <Navigate to="/dashboard" replace />} />
      <Route path="/admin/bookings" element={isPrivileged ? <AdminBookings /> : <Navigate to="/dashboard" replace />} />
      <Route path="/admin/users" element={isPrivileged ? <AdminUsers /> : <Navigate to="/dashboard" replace />} />
      <Route
        path="/admin/notifications"
        element={isPrivileged ? <AdminNotifications /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/admin/profile" element={isPrivileged ? <AdminProfile /> : <Navigate to="/dashboard" replace />} />
      <Route
        path="/admin/manager-area"
        element={isManager ? <ManagerArea /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/login" element={user ? <Navigate to={authedHome} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={authedHome} replace /> : <Register />} />
      <Route path="/contact-admin" element={<ContactAdmin />} />
      <Route path="/pending/technician" element={<PendingApproval />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
