import NotificationPanel from '../components/NotificationPanel'

export default function Dashboard() {
  return (
    <div className="grid-two">
      <div className="card">
        <h2>Overview</h2>
        <p className="muted">Key metrics and quick actions will live here.</p>
      </div>
      <NotificationPanel />
    </div>
  )
}
