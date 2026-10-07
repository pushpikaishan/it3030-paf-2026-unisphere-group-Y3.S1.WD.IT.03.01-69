import MyTicketsPanel from '../components/MyTicketsPanel'
import './css/TicketPage.css'

export default function RestorationPage() {
  return (
    <div className="restoration-page stack">
      <section className="restoration-hero">
        <div>
          <p className="eyebrow">Technician Workspace</p>
          <h2>Restoration</h2>
          <p className="muted">
            Review assigned incidents, update progress, add comments, and close completed restoration work.
          </p>
        </div>
        <div className="restoration-summary">
          <span>Ticket queue</span>
          <strong>Live</strong>
        </div>
      </section>

      <MyTicketsPanel />
    </div>
  )
}
