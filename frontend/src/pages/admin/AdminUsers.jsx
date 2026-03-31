import { useState } from 'react'
import AddAllUser from './AddAllUser'
import UsersList from './UsersList'

export default function AdminUsers() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('add')

  const handleCreated = () => setRefreshKey((key) => key + 1)

  return (
    <div className="stack">
      <div className="card">
        <h2>User Management</h2>
        <p className="muted">Create and manage platform users.</p>
        <div className="nav-session" style={{ gap: 12, marginTop: 12 }}>
          <button className={activeTab === 'add' ? 'button' : 'ghost'} type="button" onClick={() => setActiveTab('add')}>
            Add User
          </button>
          <button className={activeTab === 'pending' ? 'button' : 'ghost'} type="button" onClick={() => setActiveTab('pending')}>
            Onboarding
          </button>
          <button className={activeTab === 'approved' ? 'button' : 'ghost'} type="button" onClick={() => setActiveTab('approved')}>
            Authorized
          </button>
          <button className={activeTab === 'rejected' ? 'button' : 'ghost'} type="button" onClick={() => setActiveTab('rejected')}>
            Restricted
          </button>
          <button className={activeTab === 'disabled' ? 'button' : 'ghost'} type="button" onClick={() => setActiveTab('disabled')}>
            Deactivated
          </button>
        </div>
      </div>

      {activeTab === 'add' && <AddAllUser onCreated={handleCreated} />}

      {activeTab === 'pending' && (
        <UsersList
          refreshKey={refreshKey}
          statusFilter="PENDING"
          title="Onboarding (Pending)"
          actions={{ approve: true, reject: true, delete: true }}
        />
      )}

      {activeTab === 'approved' && (
        <UsersList
          refreshKey={refreshKey}
          statusFilter="APPROVED"
          title="Authorized (Approved)"
          actions={{ edit: true, reject: true, disable: true, delete: true }}
        />
      )}

      {activeTab === 'rejected' && (
        <UsersList
          refreshKey={refreshKey}
          statusFilter="REJECTED"
          title="Restricted (Rejected)"
          actions={{ approve: true, delete: true }}
        />
      )}

      {activeTab === 'disabled' && (
        <UsersList
          refreshKey={refreshKey}
          statusFilter="DISABLED"
          title="Deactivated"
          actions={{ approve: true, delete: true }}
        />
      )}
    </div>
  )
}

