import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../components/Loader'
import Dashboard from '../pages/Dashboard'
import BookingPage from '../pages/BookingPage'
import ResourcePage from '../pages/ResourcePage'
import TicketPage from '../pages/TicketPage'
import AdminPage from '../pages/admin/AdminPage'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { useAuth } from '../hooks/useAuth'

export default function AppRoutes() {
  const { user, loading } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  if (loading) return <Loader />

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bookings" element={<BookingPage />} />
      <Route path="/resources" element={<ResourcePage />} />
      <Route path="/tickets" element={<TicketPage />} />
      <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
