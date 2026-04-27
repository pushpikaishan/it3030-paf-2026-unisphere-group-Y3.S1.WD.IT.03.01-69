import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingStatusBadge from '../components/BookingStatusBadge'
import { useCancelBooking, useMyBookings } from '../hooks/useBookings'
import './css/bookings.css'

const formatTime = (value) => (value ? String(value).slice(0, 5) : '--:--')

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
  const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

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
        <p className="muted">Track and manage all your room booking requests from one centralized location.</p>
        <div className="my-bookings-summary-strip">
          <span>Total ({counts.ALL}): {counts.ALL}</span>
          <span>Pending ({counts.PENDING}): {counts.PENDING}</span>
          <span>Approved ({counts.APPROVED}): {counts.APPROVED}</span>
          <span>Rejected ({counts.REJECTED}): {counts.REJECTED}</span>
          <span>Cancelled ({counts.CANCELLED}): {counts.CANCELLED}</span>
        </div>
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
        <div className="card my-bookings-table-card">
          <div className="my-bookings-chip-row">
            {statusOptions.map((status) => (
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

          {bookings.length === 0 && (
            <div>
              <h3>No bookings yet</h3>
              <p className="muted">Create your first booking request from the Bookings page.</p>
            </div>
          )}

          {bookings.length > 0 && filteredBookings.length === 0 && (
            <div>
              <h3>No bookings in this status</h3>
              <p className="muted">Choose another filter to view your booking history.</p>
            </div>
          )}

          {filteredBookings.length > 0 && (
            <div className="my-bookings-table-wrap">
              <table className="my-bookings-table">
                <thead>
                  <tr>
                    <th>Room Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED'
                    const isCancelled = booking.status === 'CANCELLED'

                    return (
                      <tr key={booking.id} className={isCancelled ? 'is-cancelled' : ''}>
                        <td>
                          <div className="my-bookings-room-name">{booking.resourceName || 'Unknown Resource'}</div>
                          {booking.resourceLocation && (
                            <div className="my-bookings-room-location">{booking.resourceLocation}</div>
                          )}
                        </td>
                        <td>{booking.bookingDate}</td>
                        <td>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </td>
                        <td>{booking.purpose}</td>
                        <td>{booking.expectedAttendees}</td>
                        <td>
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn my-bookings-action-btn"
                            onClick={() => handleCancel(booking)}
                            disabled={!canCancel || busyAction === `cancel-${booking.id}`}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
