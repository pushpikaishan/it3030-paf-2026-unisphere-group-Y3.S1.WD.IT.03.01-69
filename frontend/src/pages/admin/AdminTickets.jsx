import MyTicketsPanel from '../../components/MyTicketsPanel'

export default function AdminTickets() {
  return (
    <div className="stack">
      <div className="card">
        <h2>Ticket Management</h2>
        <p className="muted">Review and manage incident tickets from all users.</p>
      </div>
      <MyTicketsPanel />
    </div>
  )
}
