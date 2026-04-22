import { useEffect, useState } from 'react'
import BookingTable from '../components/BookingTable'
import BookingActionButtons from '../components/BookingActionButtons'
import { bookingService } from '../services/bookingService'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await bookingService.getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load your bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleCancel = async (booking) => {
    setBusyId(booking.id)
    setError('')
    try {
      await bookingService.cancelBooking(booking.id)
      await loadBookings()
    } catch (err) {
      setError(err?.message || 'Cancel failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="stack">
      <div className="card">
        {/* MEMBER 2: personal booking history and owner-only cancellation flow. */}
        <h2>My Bookings</h2>
        <p className="muted">Track your booking requests and cancel approved bookings when needed.</p>
      </div>

      {error && <div className="booking-alert booking-alert--error">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="muted">Loading bookings...</p>
        ) : (
          <BookingTable
            bookings={bookings}
            emptyMessage="You have not created any bookings yet."
            renderActions={(booking) => (
              <BookingActionButtons mode="user" booking={booking} busy={busyId === booking.id} onCancel={handleCancel} />
            )}
          />
        )}
      </div>
    </div>
  )
}