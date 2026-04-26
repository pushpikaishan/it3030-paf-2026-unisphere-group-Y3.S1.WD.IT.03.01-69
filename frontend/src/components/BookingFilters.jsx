export default function BookingFilters({ filters, onChange, onReset, resources = [] }) {
  return (
    <aside className="booking-filters card">
      <h3>Filters</h3>

      <label className="filter-group">
        <span>Status</span>
        <select value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">All</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </label>

      <label className="filter-group">
        <span>Resource</span>
        <select value={filters.resourceId} onChange={(e) => onChange('resourceId', e.target.value)}>
          <option value="">All</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-group">
        <span>Date</span>
        <input type="date" value={filters.date} onChange={(e) => onChange('date', e.target.value)} />
      </label>

      <button type="button" className="btn" onClick={onReset}>
        Reset Filters
      </button>
    </aside>
  )
}
