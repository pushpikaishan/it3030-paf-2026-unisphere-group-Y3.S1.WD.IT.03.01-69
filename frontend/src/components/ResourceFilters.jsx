export default function ResourceFilters({ filters, onChange, onReset, types }) {
  return (
    <aside className="resource-filters card">
      <h3>Filters</h3>

      <label className="filter-group">
        <span>Search</span>
        <input
          type="text"
          value={filters.search}
          placeholder="Name, location, description"
          onChange={(e) => onChange('search', e.target.value)}
        />
      </label>

      <label className="filter-group">
        <span>Type</span>
        <select value={filters.type} onChange={(e) => onChange('type', e.target.value)}>
          <option value="">All types</option>
          {types?.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-group">
        <span>Min Capacity: {filters.minCapacity || 1}</span>
        <input
          type="range"
          min="1"
          max="500"
          value={filters.minCapacity || 1}
          onChange={(e) => onChange('minCapacity', Number(e.target.value))}
        />
      </label>

      <label className="filter-group">
        <span>Location</span>
        <input
          type="text"
          value={filters.location}
          placeholder="Block or building"
          onChange={(e) => onChange('location', e.target.value)}
        />
      </label>

      <label className="filter-group">
        <span>Status</span>
        <select value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
        </select>
      </label>

      <button className="btn" type="button" onClick={onReset}>
        Reset filters
      </button>
    </aside>
  )
}
