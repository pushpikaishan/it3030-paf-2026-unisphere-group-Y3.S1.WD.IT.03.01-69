import BookingForm from '../components/BookingForm'
import MaintenanceForm from '../components/MaintenanceForm'

export default function TicketPage() {
  return (
    <div className="stack forms-shell">
      <div className="card forms-hero">
        <h2>Requests & Incidents</h2>
        <p className="muted">Submit resource bookings and maintenance requests below. Both forms help keep our campus operations running smoothly.</p>
      </div>

      <div className="forms-grid">
        <div className="forms-section">
          <BookingForm />
        </div>

        <div className="forms-section">
          <MaintenanceForm />
        </div>
      </div>

      <div className="card forms-info">
        <h3>How It Works</h3>
        <div className="forms-info__grid">
          <div>
            <h4>🔧 Resource Bookings</h4>
            <p>Request access to facilities, rooms, labs, or equipment. Your request will be reviewed and you'll receive confirmation with approval status.</p>
          </div>
          <div>
            <h4>🚨 Maintenance Reports</h4>
            <p>Report maintenance issues, safety hazards, or equipment malfunctions. A technician will review your report and respond with next steps.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
