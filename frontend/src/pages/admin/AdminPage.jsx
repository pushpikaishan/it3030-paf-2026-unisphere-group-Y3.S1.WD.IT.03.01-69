import { useState } from 'react'
import AddAllUser from './AddAllUser'
import UsersList from './UsersList'

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = () => setRefreshKey((key) => key + 1)

  return (
    <div className="stack">
      <div className="card">
        <h2>Admin</h2>
        <p className="muted">Admin-only controls and management tools.</p>
      </div>
      <AddAllUser onCreated={handleCreated} />
      <UsersList refreshKey={refreshKey} />
    </div>
  )
}
