export default function NotificationPanel({ items = [] }) {
  return (
    <div className="card">
      <h3>Notifications</h3>
      {items.length === 0 && <p className="muted">No notifications yet.</p>}
      <ul className="list">
        {items.map((n) => (
          <li key={n.id}>
            <div className="list-title">{n.title}</div>
            <div className="muted">{n.message}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
