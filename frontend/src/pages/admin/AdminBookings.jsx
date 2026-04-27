import { useState } from 'react'
import BookingCard from '../../components/BookingCard'
import BookingDecisionModal from '../../components/BookingDecisionModal'
import BookingFilters from '../../components/BookingFilters'
import {
  useAdminBookings,
  useApproveBooking,
  useCancelBooking,
  useRejectBooking,
} from '../../hooks/useBookings'
import { useResources } from '../../hooks/useResources'
import '../css/bookings.css'

const initialFilters = {
  status: 'PENDING',
  resourceId: '',
  date: '',
}

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback
  if (message.includes('already booked')) {
    return 'This resource is already booked for the selected time.'
  }
  if (message.includes('Booking not found')) {
    return 'This booking no longer exists. The list has been refreshed.'
  }
  return message
}

export default function AdminBookings() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(0)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState(null)

  const queryParams = {
    status: filters.status || undefined,
    resourceId: filters.resourceId || undefined,
    date: filters.date || undefined,
    page,
    size: 10,
  }

  const { data, isLoading, isError, error, refetch } = useAdminBookings(queryParams)
  const { data: resourcesData } = useResources({ page: 0, size: 200 })

  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()
  const cancelMutation = useCancelBooking()

  const bookings = data?.content || []
  const totalPages = data?.totalPages || 1

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPage(0)
  }

  const withAction = async (actionId, action, successMessage, fallbackError) => {
    setBusyAction(actionId)
    setFeedback(null)
    try {
      await action()
      await refetch()
      setFeedback({ kind: 'success', message: successMessage })
    } catch (err) {
      if (err?.response?.status === 404) {
        await refetch()
      }
      setFeedback({ kind: 'error', message: getErrorMessage(err, fallbackError) })
    } finally {
      setBusyAction(null)
    }
  }

  const resolveBookingId = (booking) => {
    const parsed = Number(booking?.id)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  const handleApprove = (booking) =>
    {
      const bookingId = resolveBookingId(booking)
      if (!bookingId) {
        setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
        return Promise.resolve()
      }
      return withAction(
        `approve-${bookingId}`,
        () => approveMutation.mutateAsync(bookingId),
        'Booking approved successfully.',
        'Failed to approve booking.',
      )
    }

  const handleReject = async (reason) => {
    if (!rejectTarget) return
    const bookingId = resolveBookingId(rejectTarget)
    if (!bookingId) {
      setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
      setRejectTarget(null)
      return
    }

    await withAction(
      `reject-${bookingId}`,
      () => rejectMutation.mutateAsync({ id: bookingId, reason }),
      'Booking rejected successfully.',
      'Failed to reject booking.',
    )
    setRejectTarget(null)
  }

  const handleCancel = (booking) =>
    {
      const bookingId = resolveBookingId(booking)
      if (!bookingId) {
        setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
        return Promise.resolve()
      }
      return withAction(
        `cancel-${bookingId}`,
        () => cancelMutation.mutateAsync(bookingId),
        'Booking cancelled successfully.',
        'Failed to cancel booking.',
      )
    }

  return (
    <section className="booking-admin-layout">
      <BookingFilters
        filters={filters}
        onChange={onFilterChange}
        onReset={resetFilters}
        resources={resourcesData?.content || []}
      />

      <div className="booking-list-wrap">
        <div className="card bookings-header">
          <h2>Booking Management</h2>
          <p className="muted">Review booking requests and make approval decisions.</p>
        </div>

        {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

        {isLoading && (
          <div className="card">
            <p>Loading bookings...</p>
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
          <>
            <div className="bookings-grid">
              {bookings.length === 0 && (
                <div className="card">
                  <h3>No bookings found</h3>
                  <p className="muted">Try changing your filters.</p>
                </div>
              )}

              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isAdmin={true}
                  onApprove={handleApprove}
                  onReject={setRejectTarget}
                  onCancel={handleCancel}
                  showCancel={true}
                  showDelete={false}
                  busyAction={busyAction}
                />
              ))}
            </div>

            <div className="card booking-pagination">
              <button type="button" className="btn" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </button>
              <span>
                Page {Math.min(page + 1, totalPages)} of {totalPages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <BookingDecisionModal
        isOpen={Boolean(rejectTarget)}
        booking={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={busyAction?.startsWith('reject-')}
      />
    </section>
  )
}
