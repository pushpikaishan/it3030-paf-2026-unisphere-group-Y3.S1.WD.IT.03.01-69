import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingCard from '../components/BookingCard'
import { useCancelBooking, useMyBookings } from '../hooks/useBookings'
import './css/bookings.css'

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback
  if (message.includes('already booked')) {
    return 'This resource is already booked for the selected time.'
  }
  return message
}

export default function MyBookingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(location.state?.bookingFeedback || null)
  const [busyAction, setBusyAction] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data, isLoading, isError, error, refetch } = useMyBookings()
  const cancelMutation = useCancelBooking()

  const bookings = data || []
  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((booking) => booking.status === 'PENDING').length,
    APPROVED: bookings.filter((booking) => booking.status === 'APPROVED').length,
    REJECTED: bookings.filter((booking) => booking.status === 'REJECTED').length,
    CANCELLED: bookings.filter((booking) => booking.status === 'CANCELLED').length,
  }
  const filteredBookings =
    statusFilter === 'ALL'
      ? bookings
      : bookings.filter((booking) => booking.status === statusFilter)

  useEffect(() => {
    if (!location.state?.bookingFeedback) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.bookingFeedback, navigate])

  const handleCancel = async (booking) => {
    setBusyAction(`cancel-${booking.id}`)
    setFeedback(null)
    try {
      await cancelMutation.mutateAsync(booking.id)
      setFeedback({ kind: 'success', message: 'Booking cancelled successfully.' })
    } catch (err) {
      setFeedback({ kind: 'error', message: getErrorMessage(err, 'Failed to cancel booking.') })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="bookings-layout">
      <div className="card bookings-header bookings-hero">
        <h2>My Bookings</h2>
        <p className="muted">Track booking status in one place and cancel pending or approved requests.</p>
      </div>

      <div className="bookings-stats-grid">
        <div className="card bookings-stat-card">
          <span>Total</span>
          <strong>{counts.ALL}</strong>
        </div>
        <div className="card bookings-stat-card">
          <span>Pending</span>
          <strong>{counts.PENDING}</strong>
        </div>
        <div className="card bookings-stat-card">
          <span>Approved</span>
          <strong>{counts.APPROVED}</strong>
        </div>
        <div className="card bookings-stat-card">
          <span>Rejected</span>
          <strong>{counts.REJECTED}</strong>
        </div>
        <div className="card bookings-stat-card">
          <span>Cancelled</span>
          <strong>{counts.CANCELLED}</strong>
        </div>
      </div>

      <div className="card bookings-filter-bar">
        {Object.keys(counts).map((status) => (
          <button
            key={status}
            type="button"
            className={`bookings-filter-chip ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status} ({counts[status]})
          </button>
        ))}
      </div>

      {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

      {isLoading && (
        <div className="card">
          <p>Loading your bookings...</p>
        </div>
      )}

      {isError && (
        <div className="card">
          <h3>Unable to load bookings</h3>
          <p>{getErrorMessage(error, 'Please try again in a moment.')}</p>
          <button type="button" className="btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bookings-grid">
          {bookings.length === 0 && (
            <div className="card">
              <h3>No bookings yet</h3>
              <p className="muted">Create your first booking request from the Bookings page.</p>
            </div>
          )}

          {bookings.length > 0 && filteredBookings.length === 0 && (
            <div className="card">
              <h3>No bookings in this status</h3>
              <p className="muted">Choose another filter to view your booking history.</p>
            </div>
          )}

          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} busyAction={busyAction} />
          ))}
        </div>
      )}
    </section>
  )
}
