import { Link } from 'react-router-dom'
import ResourceStatusBadge from './ResourceStatusBadge'

export default function ResourceCard({
  resource,
  isAdmin,
  onEdit,
  onDelete,
  onToggleStatus,
  onBookNow,
  canBook,
  isBooked,
}) {
  return (
    <article className="resource-card">
      <div className="resource-card-top">
        <h3>{resource.name}</h3>
        <ResourceStatusBadge status={resource.status} />
      </div>

      <p className="resource-type">{resource.type?.replaceAll('_', ' ')}</p>
      <p className="resource-meta">Capacity: {resource.capacity}</p>
      <p className="resource-meta">Location: {resource.location}</p>

      <div className="resource-card-actions">
        <Link className="btn ghost" to={`/resources/${resource.id}`}>
          View details
        </Link>

        <button className="btn primary" type="button" onClick={() => onBookNow?.(resource)} disabled={!canBook || isBooked}>
          {isBooked ? 'Booked' : 'Book Now'}
        </button>

        {isAdmin && (
          <>
            <button className="btn" type="button" onClick={() => onEdit(resource)}>
              Edit
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => onToggleStatus(resource)}
            >
              {resource.status === 'ACTIVE' ? 'Mark out of service' : 'Mark active'}
            </button>
            <button className="btn danger" type="button" onClick={() => onDelete(resource)}>
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  )
}
