import { useCallback, useEffect, useState } from 'react'
import BookingActionButtons from '../components/BookingActionButtons'
import BookingFilters from '../components/BookingFilters'
import BookingTable from '../components/BookingTable'
import { bookingService } from '../services/bookingService'

const DEFAULT_FILTERS = {
  status: '',
  resource: '',
  date: '',
}

export default function AdminBookingsPage() {
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rejectionReasons, setRejectionReasons] = useState({})

  const loadBookings = useCallback(async (filters = appliedFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await bookingService.getAllBookings(filters)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleApply = async (event) => {
    event.preventDefault()
    setAppliedFilters(draftFilters)
    await loadBookings(draftFilters)
  }

  const handleReset = async () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    await loadBookings(DEFAULT_FILTERS)
  }

  const handleApprove = async (booking) => {
    setBusyId(booking.id)
    setError('')
    setSuccess('')
    try {
      await bookingService.approveBooking(booking.id)
      setSuccess('Booking approved successfully.')
      await loadBookings()
    } catch (err) {
      setError(err?.message || 'Approve failed')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (booking) => {
    const reason = rejectionReasons[booking.id] || ''
    if (!reason.trim()) {
      setError('Rejection reason is required.')
      return
    }

    setBusyId(booking.id)
    setError('')
    setSuccess('')
    try {
      await bookingService.rejectBooking(booking.id, reason)
      setSuccess('Booking rejected successfully.')
      setRejectionReasons((current) => ({ ...current, [booking.id]: '' }))
      await loadBookings()
    } catch (err) {
      setError(err?.message || 'Reject failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="stack">
      <div className="card">
        {/* MEMBER 2: admin approval workflow with filtering and inline rejection reasons. */}
        <h2>Booking Management</h2>
        <p className="muted">Review, approve, reject, and filter all booking requests.</p>
      </div>

      <BookingFilters
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={handleApply}
        onReset={handleReset}
        loading={loading}
      />

      {error && <div className="booking-alert booking-alert--error">{error}</div>}
      {success && <div className="booking-alert booking-alert--success">{success}</div>}

      <div className="card">
        {loading ? (
          <p className="muted">Loading bookings...</p>
        ) : (
          <BookingTable
            bookings={bookings}
            showOwner
            emptyMessage="No bookings match the current filters."
            renderActions={(booking) => (
              <BookingActionButtons
                mode="admin"
                booking={booking}
                rejectionReason={rejectionReasons[booking.id] || ''}
                onRejectReasonChange={(currentBooking, value) =>
                  setRejectionReasons((current) => ({ ...current, [currentBooking.id]: value }))
                }
                onApprove={handleApprove}
                onReject={handleReject}
                busy={busyId === booking.id}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}