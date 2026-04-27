const statuses = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

const formatLabel = (value) =>
  value
    ? value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'All'

export default function BookingFilters({ filters, onChange, onReset, resourceTypes = [] }) {
  return (
    <section className="booking-filters card">
      <div className="booking-filters-row">
        <div className="booking-filter-group">
          <span className="booking-filter-title">Status</span>
          <div className="booking-chip-row">
            {statuses.map((status) => (
              <button
                key={status || 'ALL'}
                type="button"
                className={`booking-chip${filters.status === status ? ' active' : ''}`}
                onClick={() => onChange('status', status)}
              >
                {formatLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="booking-filter-group">
          <span className="booking-filter-title">Resource Type</span>
          <div className="booking-chip-row">
            <button
              type="button"
              className={`booking-chip${!filters.resourceType ? ' active' : ''}`}
              onClick={() => onChange('resourceType', '')}
            >
              All
            </button>
            {resourceTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`booking-chip${filters.resourceType === type ? ' active' : ''}`}
                onClick={() => onChange('resourceType', type)}
              >
                {formatLabel(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="booking-filters-row booking-filters-actions">
        <label className="booking-date-filter">
          <span className="booking-filter-title">Date</span>
          <input type="date" value={filters.date} onChange={(e) => onChange('date', e.target.value)} />
        </label>

        <button type="button" className="btn" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </section>
  )
}
