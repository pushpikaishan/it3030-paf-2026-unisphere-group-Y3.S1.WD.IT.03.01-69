import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import './css/profile.css'

export default function Profile() {
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [profileImage, setProfileImage] = useState(user?.profileImage || user?.picture || '')
  const [email, setEmail] = useState(user?.email || '')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setProfileImage(user.profileImage || user.picture || '')
      setEmail(user.email || '')
    }
  }, [user])

  const avatar = useMemo(() => {
    return profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}`
  }, [profileImage, user?.email, user?.name])

  if (!user) return null

  const handleSave = async () => {
    if (!user?.id) {
      setStatus('Missing user id. Please log in again and retry.')
      return
    }

    if (!editing) {
      setEditing(true)
      return
    }

    if (showPasswordFields) {
      if (!newPassword) {
        setStatus('Enter a new password before saving')
        return
      }
      if (newPassword !== confirmPassword) {
        setStatus('Passwords do not match')
        return
      }
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = { ...user, name, email, profileImage }
      if (showPasswordFields && newPassword) {
        payload.password = newPassword
      }

      await userService.update(user.id, payload)
      await refresh()
      setStatus('Profile updated successfully')
      setEditing(false)
      setShowPasswordFields(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setStatus(err?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (!editing) setEditing(true)
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result)
        setStatus('Preview updated. Save changes to apply.')
      }
    }
    reader.onerror = () => setStatus('Could not read image file')
    reader.readAsDataURL(file)
  }

  const handleDelete = async () => {
    if (!user?.id) {
      setStatus('Missing user id. Please log in again and retry.')
      return
    }

    const confirmed = window.confirm('Disable your account? It will be scheduled for permanent deletion in 1 month.')
    if (!confirmed) return

    setSaving(true)
    setStatus('')
    try {
      const res = await userService.disable(user.id)
      const message = res?.message || 'Your account has been temporarily disabled. It will be permanently deleted in 1 month.'
      setStatus(message)
      await logout()
      navigate('/login', { state: { message } })
    } catch (err) {
      setStatus(err?.message || 'Unable to delete account')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img
            className="profile-avatar"
            src={avatar}
            alt="Profile avatar"
            onClick={handleAvatarClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAvatarClick()
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div>
            <h2 className="profile-name">{name || user?.email || 'Profile'}</h2>
            {user?.email && <p className="profile-email">{user.email}</p>}
          </div>
        </div>

        {user?.createdAt && (
          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Member Since</span>
              <span className="meta-value">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {editing && (
          <>
            {!showPasswordFields && (
              <>
                <div className="input-group">
                  <label className="input-label" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </>
            )}

            {showPasswordFields && (
              <>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </>
            )}
          </>
        )}

        {status && <div className="status-message">{status}</div>}

        <div className="profile-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setEditing(true)
              setShowPasswordFields((prev) => {
                const next = !prev
                if (!next) {
                  setNewPassword('')
                  setConfirmPassword('')
                }
                return next
              })
              setStatus('')
            }}
          >
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
          </button>
          <button className="btn btn-secondary" onClick={handleDelete} disabled={saving}>
            Delete Account
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}