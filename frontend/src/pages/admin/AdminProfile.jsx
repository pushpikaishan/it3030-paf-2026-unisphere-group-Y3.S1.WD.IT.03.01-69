import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const avatar = user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="profile-hero">
      <div className="profile-card">
        <div className="profile-header">
          <img className="profile-avatar" src={avatar} alt="Admin avatar" />
          <div>
            <h2 className="profile-name">{user?.name || 'Admin'}</h2>
            {user?.email && <p className="muted">{user.email}</p>}
          </div>
        </div>

        <div className="profile-meta">
          <div>
            <div className="muted">Role</div>
            <div className="profile-value">{user?.role || 'ADMIN'}</div>
          </div>
          <div>
            <div className="muted">Provider</div>
            <div className="profile-value">{user?.provider || 'LOCAL'}</div>
          </div>
          {user?.createdAt && (
            <div>
              <div className="muted">Joined</div>
              <div className="profile-value">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <Link className="button" to="/admin/users">Update Profile</Link>
          <Link className="ghost" to="/admin/users">Delete Profile</Link>
          <button className="button danger" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="profile-glow" aria-hidden="true" />
    </div>
  )
}
