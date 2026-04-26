import { useEffect, useMemo, useState } from 'react'
import BookingFilters from '../components/BookingFilters'
import BookingTable from '../components/BookingTable'
import RejectBookingModal from '../components/RejectBookingModal'
import bookingService from '../services/bookingService'
import { resourceApi } from '../services/resourceApi'
import '../styles/AdminBookings.css'

const initialFilters = {
  status: '',
  date: '',
  resourceId: '',
}

const statusTabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message
  const message = apiMessage || error?.message || fallback

  if (error?.response?.status === 409 || message.toLowerCase().includes('time slot already booked')) {
    return 'Time slot already booked for this resource'
  }

  return message
}

export default function AdminBookings() {
  const [filters, setFilters] = useState(initialFilters)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)

  const queryParams = useMemo(
    () => ({
      status: filters.status || undefined,
      date: filters.date || undefined,
      resourceId: filters.resourceId || undefined,
      page: 0,
      size: 500,
    }),
    [filters],
  )

  const loadBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await bookingService.getBookings(queryParams)
      setBookings(data?.content || [])
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Admin access required to view all booking requests')
      } else {
        setError(getErrorMessage(err, 'Failed to load bookings'))
      }
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      const data = await resourceApi.getResources({ page: 0, size: 200 })
      setResources(data?.content || [])
    } catch {
      setResources([])
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  useEffect(() => {
    loadBookings()
  }, [queryParams])

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const onResetFilters = () => {
    setFilters(initialFilters)
  }

  const runAction = async (actionKey, action, successMessage, fallbackError) => {
    setBusyAction(actionKey)
    setFeedback(null)
    try {
      await action()
      setFeedback({ kind: 'success', message: successMessage })
      await loadBookings()
    } catch (err) {
      setFeedback({ kind: 'error', message: getErrorMessage(err, fallbackError) })
    } finally {
      setBusyAction('')
    }
  }

  const onApprove = (booking) =>
    runAction(
      `approve-${booking.id}`,
      () => bookingService.approveBooking(booking.id),
      'Booking approved successfully',
      'Failed to approve booking',
    )

  const onReject = async (reason) => {
    if (!rejectTarget) return

    await runAction(
      `reject-${rejectTarget.id}`,
      () => bookingService.rejectBooking(rejectTarget.id, reason),
      'Booking rejected successfully',
      'Failed to reject booking',
    )
    setRejectTarget(null)
  }

  const onCancel = (booking) =>
    runAction(
      `cancel-${booking.id}`,
      () => bookingService.cancelBooking(booking.id),
      'Booking cancelled successfully',
      'Failed to cancel booking',
    )

  return (
    <section className="admin-bookings-layout">
      <BookingFilters filters={filters} onChange={onFilterChange} onReset={onResetFilters} resources={resources} />

      <div className="admin-bookings-main">
        <div className="card bookings-header">
          <h2>Booking Management</h2>
          <p className="muted">
            Review all booking requests with workflow: PENDING to APPROVED or REJECTED. Only approved bookings can be
            cancelled.
          </p>
          <div className="admin-bookings-toolbar">
            <div className="admin-bookings-tabs">
              {statusTabs.map((tab) => {
                const value = tab === 'ALL' ? '' : tab
                const isActive = filters.status === value
                return (
                  <button
                    key={tab}
                    type="button"
                    className={isActive ? 'button' : 'ghost'}
                    onClick={() => onFilterChange('status', value)}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
            <button type="button" className="ghost" onClick={loadBookings}>
              Refresh
            </button>
          </div>
        </div>

        {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

        {loading && (
          <div className="card">
            <p>Loading bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="card">
            <h3>Unable to load bookings</h3>
            <p>{error}</p>
            <button type="button" className="btn" onClick={loadBookings}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <BookingTable
            bookings={bookings}
            onApprove={onApprove}
            onOpenReject={setRejectTarget}
            onCancel={onCancel}
            busyAction={busyAction}
          />
        )}
      </div>

      <RejectBookingModal
        isOpen={Boolean(rejectTarget)}
        booking={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={onReject}
        loading={busyAction.startsWith('reject-')}
      />
    </section>
  )
}
