import { useState } from 'react'
import AddAllUser from './AddAllUser'
import UsersList from './UsersList'

export default function AdminUsers() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = () => setRefreshKey((key) => key + 1)

  return (
    <div className="stack">
      <div className="card">
        <h2>User Management</h2>
        <p className="muted">Create and manage platform users.</p>
      </div>
      <AddAllUser onCreated={handleCreated} />
      <UsersList refreshKey={refreshKey} />
    </div>
  )
}
