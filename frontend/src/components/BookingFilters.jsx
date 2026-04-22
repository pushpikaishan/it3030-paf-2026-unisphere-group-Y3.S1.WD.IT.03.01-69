import { BOOKING_RESOURCES } from '../services/bookingService'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function BookingFilters({ value, onChange, onApply, onReset, loading }) {
  return (
    <form className="booking-filters card" onSubmit={onApply}>
      <div className="booking-filters__grid">
        <label className="field">
          <span>Status</span>
          <select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Resource</span>
          <select value={value.resource} onChange={(event) => onChange({ ...value, resource: event.target.value })}>
            <option value="">All resources</option>
            {BOOKING_RESOURCES.map((resource) => (
              <option key={resource.value} value={resource.value}>
                {resource.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <input type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} />
        </label>
      </div>

      <div className="booking-filters__actions">
        <button className="button" type="submit" disabled={loading}>
          Apply Filters
        </button>
        <button className="ghost" type="button" onClick={onReset} disabled={loading}>
          Reset
        </button>
      </div>
    </form>
  )
}