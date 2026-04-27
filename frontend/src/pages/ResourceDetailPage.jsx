import { Link, useParams } from 'react-router-dom'
import ResourceStatusBadge from '../components/ResourceStatusBadge'
import { useResource } from '../hooks/useResources'
import './css/resources.css'

export default function ResourceDetailPage() {
  const { id } = useParams()
  const { data: resource, isLoading, isError, error } = useResource(id)

  if (isLoading) {
    return (
      <div className="card">
        <h2>Loading resource...</h2>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card">
        <h2>Could not load resource</h2>
        <p>{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
        <Link className="btn" to="/resources">
          Back to catalogue
        </Link>
      </div>
    )
  }

  return (
    <section className="resource-detail card">
      <div className="resource-detail-head">
        <div>
          <h2>{resource.name}</h2>
          <p className="resource-type">{resource.type?.replaceAll('_', ' ')}</p>
        </div>
        <ResourceStatusBadge status={resource.status} />
      </div>

      {resource.imageUrl && (
        <img className="resource-detail-image" src={resource.imageUrl} alt={resource.name} />
      )}

      <div className="resource-detail-grid">
        <div>
          <h4>Capacity</h4>
          <p>{resource.capacity}</p>
        </div>
        <div>
          <h4>Location</h4>
          <p>{resource.location}</p>
        </div>
        <div>
          <h4>Availability</h4>
          <p>{resource.availabilityWindows || 'Not specified'}</p>
        </div>
        <div>
          <h4>Description</h4>
          <p>{resource.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="resource-detail-actions">
        <Link className="btn" to="/resources">
          Back to catalogue
        </Link>
      </div>
    </section>
  )
}
