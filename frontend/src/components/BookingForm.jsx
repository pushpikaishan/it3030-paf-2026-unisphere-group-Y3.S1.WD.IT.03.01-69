import { useMemo, useState } from 'react'

const initialForm = {
  resourceId: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: 1,
}

export default function BookingForm({ resources = [], onSubmit, loading = false }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const resourceOptions = useMemo(() => resources.filter((resource) => resource.status === 'ACTIVE'), [resources])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.resourceId) nextErrors.resourceId = 'Resource is required'
    if (!form.bookingDate) nextErrors.bookingDate = 'Date is required'
    if (!form.startTime) nextErrors.startTime = 'Start time is required'
    if (!form.endTime) nextErrors.endTime = 'End time is required'
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      nextErrors.endTime = 'End time must be after start time'
    }
    if (!form.purpose.trim()) nextErrors.purpose = 'Purpose is required'
    if (!Number.isFinite(Number(form.expectedAttendees)) || Number(form.expectedAttendees) <= 0) {
      nextErrors.expectedAttendees = 'Expected attendees must be positive'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    await onSubmit({
      resourceId: Number(form.resourceId),
      bookingDate: form.bookingDate,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: form.purpose.trim(),
      expectedAttendees: Number(form.expectedAttendees),
    })

    setForm(initialForm)
    setErrors({})
  }

  return (
    <form className="booking-form card" onSubmit={handleSubmit}>
      <h3>Request a Booking</h3>

      <label>
        <span>Resource</span>
        <select value={form.resourceId} onChange={(e) => setField('resourceId', e.target.value)}>
          <option value="">Select a resource</option>
          {resourceOptions.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} ({resource.location})
            </option>
          ))}
        </select>
        {errors.resourceId && <small className="form-error">{errors.resourceId}</small>}
      </label>

      <div className="booking-form-grid">
        <label>
          <span>Date</span>
          <input type="date" value={form.bookingDate} onChange={(e) => setField('bookingDate', e.target.value)} />
          {errors.bookingDate && <small className="form-error">{errors.bookingDate}</small>}
        </label>

        <label>
          <span>Start time</span>
          <input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} />
          {errors.startTime && <small className="form-error">{errors.startTime}</small>}
        </label>

        <label>
          <span>End time</span>
          <input type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} />
          {errors.endTime && <small className="form-error">{errors.endTime}</small>}
        </label>

        <label>
          <span>Expected attendees</span>
          <input
            type="number"
            min="1"
            value={form.expectedAttendees}
            onChange={(e) => setField('expectedAttendees', e.target.value)}
          />
          {errors.expectedAttendees && <small className="form-error">{errors.expectedAttendees}</small>}
        </label>
      </div>

      <label>
        <span>Purpose</span>
        <textarea
          rows="3"
          value={form.purpose}
          onChange={(e) => setField('purpose', e.target.value)}
          placeholder="Describe why you need this resource"
        />
        {errors.purpose && <small className="form-error">{errors.purpose}</small>}
      </label>

      <button type="submit" className="btn primary" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Booking Request'}
      </button>
    </form>
  )
}
