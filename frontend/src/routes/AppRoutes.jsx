import { Navigate, Route, Routes } from 'react-router-dom'
import NotFound from '../components/NotFound'
import Loader from '../components/Loader'
import Dashboard from '../pages/Dashboard'
import BookingPage from '../pages/BookingPage'
import MyBookingsPage from '../pages/MyBookingsPage'
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
import AdminBookings from '../pages/admin/AdminBookings'
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
      <Route path="/dashboard" element={user ? <Dashboard /> : <NotFound />} />
      <Route path="/bookings" element={user ? <BookingPage /> : <Navigate to="/login" replace />} />
      <Route path="/my-bookings" element={user ? <MyBookingsPage /> : <Navigate to="/login" replace />} />
      <Route path="/resources" element={<ResourcePage />} />
      <Route path="/resources/:id" element={<ResourceDetailPage />} />
      <Route path="/tickets" element={<TicketPage />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={isPrivileged ? <Navigate to="/admin/dashboard" replace /> : <NotFound />}
      />
      <Route path="/admin/dashboard" element={isPrivileged ? <AdminDashboard /> : <NotFound />} />
      <Route path="/admin/resources" element={isPrivileged ? <AdminResources /> : <NotFound />} />
      <Route path="/admin/bookings" element={isPrivileged ? <AdminBookings /> : <NotFound />} />
      <Route path="/admin/users" element={isPrivileged ? <AdminUsers /> : <NotFound />} />
      <Route
        path="/admin/notifications"
        element={isPrivileged ? <AdminNotifications /> : <NotFound />}
      />
      <Route path="/admin/profile" element={isPrivileged ? <AdminProfile /> : <NotFound />} />
      <Route
        path="/admin/manager-area"
        element={isManager ? <ManagerArea /> : <NotFound />}
      />
      <Route path="/login" element={user ? <Navigate to={authedHome} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={authedHome} replace /> : <Register />} />
      <Route path="/contact-admin" element={<ContactAdmin />} />
      <Route path="/pending/technician" element={<PendingApproval />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}
