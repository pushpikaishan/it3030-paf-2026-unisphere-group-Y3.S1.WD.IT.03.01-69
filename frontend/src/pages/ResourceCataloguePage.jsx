import { useEffect, useMemo, useState } from 'react'
import ResourceCard from '../components/ResourceCard'
import ResourceDeleteConfirmation from '../components/ResourceDeleteConfirmation'
import ResourceFilters from '../components/ResourceFilters'
import ResourceForm from '../components/ResourceForm'
import ResourceSkeletonCard from '../components/ResourceSkeletonCard'
import {
  useCreateResource,
  useDeleteResource,
  useResources,
  useResourceTypes,
  useUpdateResource,
  useUpdateResourceStatus,
} from '../hooks/useResources'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { bookingApi } from '../services/bookingApi'
import './css/resources.css'

const initialFilters = {
  search: '',
  type: '',
  minCapacity: 1,
  location: '',
  status: '',
}

const initialBookingForm = {
  bookingDate: '',
  startTime: '',
  purpose: '',
  expectedAttendees: 1,
}

const SLOT_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const startHour = 8 + index
  const endHour = startHour + 2
  const startTime = `${String(startHour).padStart(2, '0')}:00`
  const endTime = `${String(endHour).padStart(2, '0')}:00`
  return {
    value: startTime,
    endTime,
    label: `${startTime} - ${endTime}`,
  }
})

const toMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number)
  return hours * 60 + minutes
}

const normalizeErrorMessage = (error, fallback) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallback
  return message
}

export default function ResourceCataloguePage({ managementEnabled = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canRequestBookings = user?.role === 'USER'
  const canManageResources = managementEnabled && isPrivileged

  const [filters, setFilters] = useState(initialFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(8)

  const [formOpen, setFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bookingTarget, setBookingTarget] = useState(null)
  const [bookingForm, setBookingForm] = useState(initialBookingForm)
  const [bookingErrors, setBookingErrors] = useState({})
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookedSlots, setBookedSlots] = useState([])
  const [bookedSlotsLoading, setBookedSlotsLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryParams = useMemo(
    () => ({
      page,
      size,
      search: debouncedSearch || undefined,
      type: filters.type || undefined,
      minCapacity: filters.minCapacity || undefined,
      location: filters.location || undefined,
      status: filters.status || undefined,
    }),
    [page, size, debouncedSearch, filters.type, filters.minCapacity, filters.location, filters.status],
  )

  const { data, isLoading, isError, error, refetch } = useResources(queryParams)
  const { data: resourceTypes } = useResourceTypes()

  const createMutation = useCreateResource()
  const updateMutation = useUpdateResource()
  const deleteMutation = useDeleteResource()
  const statusMutation = useUpdateResourceStatus()

  const content = data?.content || []
  const totalPages = data?.totalPages || 1

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const handleReset = () => {
    setFilters(initialFilters)
    setDebouncedSearch('')
    setPage(0)
  }

  const notify = (kind, message) => {
    setToast({ kind, message })
    setTimeout(() => setToast(null), 2500)
  }

  const handleFormSubmit = async (payload) => {
    if (!canManageResources) return
    try {
      if (editingResource) {
        await updateMutation.mutateAsync({ id: editingResource.id, payload })
        notify('success', 'Resource updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        notify('success', 'Resource created successfully')
      }
      setFormOpen(false)
      setEditingResource(null)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to save resource'))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!canManageResources) return
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      notify('success', 'Resource deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to delete resource'))
    }
  }

  const handleToggleStatus = async (resource) => {
    if (!canManageResources) return
    const nextStatus = resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
    try {
      await statusMutation.mutateAsync({ id: resource.id, status: nextStatus })
      notify('success', `Resource marked ${nextStatus.replaceAll('_', ' ')}`)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to update status'))
    }
  }

  const toLocalDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const minBookingDate = toLocalDate(new Date())

  const closeBookingModal = () => {
    if (bookingSubmitting) return
    setBookingTarget(null)
    setBookingForm(initialBookingForm)
    setBookingErrors({})
    setBookedSlots([])
  }

  const openBookingModal = (resource) => {
    const capacity = Number(resource?.capacity)
    setBookingTarget(resource)
    setBookingErrors({})
    setBookingForm({
      ...initialBookingForm,
      expectedAttendees: Number.isFinite(capacity) && capacity > 0 ? Math.min(capacity, 10) : 1,
    })
  }

  const setBookingField = (key, value) => {
    setBookingForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'bookingDate' ? { startTime: '' } : {}),
    }))
    setBookingErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const getEndTimeForStart = (startTime) => SLOT_OPTIONS.find((slot) => slot.value === startTime)?.endTime || ''
  const isSlotUnavailable = (slot) =>
    bookedSlots.some((booked) => toMinutes(slot.value) < toMinutes(booked.endTime) && toMinutes(slot.endTime) > toMinutes(booked.startTime))

  useEffect(() => {
    if (!bookingTarget?.id || !bookingForm.bookingDate) {
      setBookedSlots([])
      return
    }

    let isActive = true
    setBookedSlotsLoading(true)
    bookingApi
      .getBookedSlots(bookingTarget.id, bookingForm.bookingDate)
      .then((slots) => {
        if (!isActive) return
        setBookedSlots(Array.isArray(slots) ? slots : [])
      })
      .catch(() => {
        if (!isActive) return
        setBookedSlots([])
      })
      .finally(() => {
        if (!isActive) return
        setBookedSlotsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [bookingTarget?.id, bookingForm.bookingDate])

  const validateBookingForm = () => {
    const nextErrors = {}
    const selectedCapacity = Number(bookingTarget?.capacity)
    const attendees = Number(bookingForm.expectedAttendees)

    if (!bookingForm.bookingDate) nextErrors.bookingDate = 'Date is required'
    if (!bookingForm.startTime) nextErrors.startTime = 'Start time is required'

    if (bookingForm.bookingDate) {
      const selectedDate = new Date(`${bookingForm.bookingDate}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        nextErrors.bookingDate = 'Booking date cannot be in the past'
      }
    }

    const selectedSlot = SLOT_OPTIONS.find((slot) => slot.value === bookingForm.startTime)
    if (bookingForm.startTime && !selectedSlot) {
      nextErrors.startTime = 'Select a valid 2-hour slot between 08:00 and 19:00'
    } else if (selectedSlot && isSlotUnavailable(selectedSlot)) {
      nextErrors.startTime = 'This time slot is already booked for the selected date'
    }

    if (!bookingForm.purpose.trim()) nextErrors.purpose = 'Purpose is required'

    if (!Number.isFinite(attendees) || attendees <= 0) {
      nextErrors.expectedAttendees = 'Expected attendees must be positive'
    } else if (Number.isFinite(selectedCapacity) && selectedCapacity > 0 && attendees > selectedCapacity) {
      nextErrors.expectedAttendees = `Expected attendees cannot exceed capacity (${selectedCapacity})`
    }

    setBookingErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitBookingRequest = async (event) => {
    event.preventDefault()
    if (!bookingTarget) return
    if (!validateBookingForm()) return

    const payload = {
      resourceId: bookingTarget.id,
      bookingDate: bookingForm.bookingDate,
      startTime: bookingForm.startTime,
      endTime: getEndTimeForStart(bookingForm.startTime),
      purpose: bookingForm.purpose.trim(),
      expectedAttendees: Number(bookingForm.expectedAttendees),
    }

    setBookingSubmitting(true)
    try {
      const createdBooking = await bookingApi.requestBooking(payload)
      closeBookingModal()
      navigate('/my-bookings', {
        state: {
          bookingFeedback: {
            kind: 'success',
            message: `${bookingTarget.name} booking request submitted. Status: ${createdBooking?.status || 'PENDING'}.`,
          },
        },
      })
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Could not complete booking request.'))
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleBookNow = async (resource) => {
    if (!user) {
      notify('error', 'Please log in to book resources.')
      navigate('/login')
      return
    }

    if (!canRequestBookings) {
      notify('error', 'Only USER accounts can create booking requests.')
      return
    }

    openBookingModal(resource)
  }

  return (
    <section className="resource-layout">
      <ResourceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        types={resourceTypes || []}
      />

      <div className="resource-main">
        <header className="resource-header card">
          <div>
            <h2>Facilities Catalogue</h2>
            <p className="muted">
              {canManageResources
                ? 'Browse and manage campus facilities and assets.'
                : 'Browse campus facilities and assets.'}
            </p>
          </div>

          <div className="resource-header-actions">
            <label>
              Page size
              <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </label>
            {canManageResources && (
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setEditingResource(null)
                  setFormOpen(true)
                }}
              >
                Add Resource
              </button>
            )}
          </div>
        </header>

        {toast && <div className={`resource-toast ${toast.kind}`}>{toast.message}</div>}

        {isLoading && (
          <div className="resource-grid">
            {Array.from({ length: size }).map((_, idx) => (
              <ResourceSkeletonCard key={idx} />
            ))}
          </div>
        )}

        {isError && (
          <div className="card">
            <h3>Could not load resources</h3>
            <p>{normalizeErrorMessage(error, 'Please try again in a moment.')}</p>
            <button className="btn" type="button" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="resource-grid">
              {content.length === 0 && (
                <div className="card resource-empty">
                  <h3>No resources found</h3>
                  <p>Try adjusting your filters or search terms.</p>
                </div>
              )}

              {content.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAdmin={canManageResources}
                  onBookNow={handleBookNow}
                  canBook={resource.status === 'ACTIVE' && canRequestBookings}
                  onEdit={(item) => {
                    setEditingResource(item)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>

            <div className="resource-pagination card">
              <button className="btn" type="button" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </button>
              <span>
                Page {Math.min(page + 1, totalPages)} of {totalPages}
              </span>
              <button
                className="btn"
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <ResourceForm
        isOpen={canManageResources && formOpen}
        resource={editingResource}
        types={resourceTypes || []}
        onClose={() => {
          setFormOpen(false)
          setEditingResource(null)
        }}
        onSubmit={handleFormSubmit}
      />

      <ResourceDeleteConfirmation
        isOpen={canManageResources && Boolean(deleteTarget)}
        resourceName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {bookingTarget && (
        <div className="resource-modal-backdrop" role="dialog" aria-modal="true">
          <div className="resource-modal card booking-request-modal">
            <div className="resource-modal-header">
              <div>
                <h3>Request Booking</h3>
                <p className="muted">
                  {bookingTarget.name} ({bookingTarget.location})
                </p>
              </div>
              <button className="btn" type="button" onClick={closeBookingModal} disabled={bookingSubmitting}>
                Close
              </button>
            </div>

            <form className="booking-request-form" onSubmit={submitBookingRequest}>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  min={minBookingDate}
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingField('bookingDate', e.target.value)}
                />
                {bookingErrors.bookingDate && <small className="form-error">{bookingErrors.bookingDate}</small>}
              </label>

              <div className="booking-request-grid">
                <label>
                  <span>Time Slot (2 Hours)</span>
                  <select
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingField('startTime', e.target.value)}
                    disabled={!bookingForm.bookingDate || bookedSlotsLoading}
                  >
                    <option value="">
                      {!bookingForm.bookingDate
                        ? 'Select a date first'
                        : bookedSlotsLoading
                          ? 'Loading available slots...'
                          : 'Select a slot'}
                    </option>
                    {SLOT_OPTIONS.map((slot) => (
                      <option key={slot.value} value={slot.value} disabled={isSlotUnavailable(slot)}>
                        {slot.label}{isSlotUnavailable(slot) ? ' (Unavailable)' : ''}
                      </option>
                    ))}
                  </select>
                  {bookingErrors.startTime && <small className="form-error">{bookingErrors.startTime}</small>}
                  {bookingForm.bookingDate && !bookedSlotsLoading && SLOT_OPTIONS.every(isSlotUnavailable) && (
                    <small className="form-error">All slots are already booked on this date.</small>
                  )}
                </label>

                <label>
                  <span>End Time</span>
                  <input
                    type="time"
                    value={getEndTimeForStart(bookingForm.startTime)}
                    readOnly
                  />
                  <small className="muted">Auto-generated to match a fixed 2-hour slot.</small>
                </label>

                <label>
                  <span>Expected Attendees</span>
                  <input
                    type="number"
                    min="1"
                    max={bookingTarget.capacity || undefined}
                    value={bookingForm.expectedAttendees}
                    onChange={(e) => setBookingField('expectedAttendees', e.target.value)}
                  />
                  {bookingErrors.expectedAttendees && (
                    <small className="form-error">{bookingErrors.expectedAttendees}</small>
                  )}
                </label>
              </div>

              <label>
                <span>Purpose</span>
                <textarea
                  rows="4"
                  maxLength={500}
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingField('purpose', e.target.value)}
                  placeholder="Describe why you need this resource"
                />
                {bookingErrors.purpose && <small className="form-error">{bookingErrors.purpose}</small>}
              </label>

              <div className="resource-modal-footer">
                <button className="btn" type="button" onClick={closeBookingModal} disabled={bookingSubmitting}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={bookingSubmitting}>
                  {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
