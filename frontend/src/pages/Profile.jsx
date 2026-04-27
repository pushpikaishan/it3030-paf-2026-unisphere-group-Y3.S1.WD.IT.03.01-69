import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TwoFactorChallengeModal from '../components/TwoFactorChallengeModal'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { addNotification, getNotificationUserKey } from '../utils/notificationSettings'
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
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false)
  const [showAppOtpModal, setShowAppOtpModal] = useState(false)
  const [showActionTwoFactorModal, setShowActionTwoFactorModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [twoFactorStatus, setTwoFactorStatus] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpStatus, setOtpStatus] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState(null)
  const [otpRemainingSeconds, setOtpRemainingSeconds] = useState(0)
  const [appCode, setAppCode] = useState('')
  const [appStatus, setAppStatus] = useState('')
  const [appQrUrl, setAppQrUrl] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [appSetupExpiresAt, setAppSetupExpiresAt] = useState(null)
  const [appSetupRemainingSeconds, setAppSetupRemainingSeconds] = useState(0)
  const [actionTwoFactorStatus, setActionTwoFactorStatus] = useState('')
  const [actionChallengeId, setActionChallengeId] = useState('')
  const [actionChallengeMethods, setActionChallengeMethods] = useState({ email: false, app: false })
  const [pendingTwoFactorAction, setPendingTwoFactorAction] = useState('')
  const [lastLoginText, setLastLoginText] = useState('No login activity is available yet.')
  const [twoFactorMethods, setTwoFactorMethods] = useState({ email: false, app: false })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setProfileImage(user.profileImage || user.picture || '')
      setEmail(user.email || '')
    }
  }, [user])

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8085'

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(''), 2000)
    return () => clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!passwordStatus) return
    const timer = setTimeout(() => setPasswordStatus(''), 2000)
    return () => clearTimeout(timer)
  }, [passwordStatus])

  useEffect(() => {
    if (!twoFactorStatus) return
    const timer = setTimeout(() => setTwoFactorStatus(''), 2000)
    return () => clearTimeout(timer)
  }, [twoFactorStatus])

  useEffect(() => {
    if (!otpStatus) return
    const timer = setTimeout(() => setOtpStatus(''), 2500)
    return () => clearTimeout(timer)
  }, [otpStatus])

  useEffect(() => {
    if (!appStatus) return
    const timer = setTimeout(() => setAppStatus(''), 2500)
    return () => clearTimeout(timer)
  }, [appStatus])

  useEffect(() => {
    if (!actionTwoFactorStatus) return
    const timer = setTimeout(() => setActionTwoFactorStatus(''), 2500)
    return () => clearTimeout(timer)
  }, [actionTwoFactorStatus])

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    const loadTwoFactorStatus = async () => {
      try {
        const data = await userService.getTwoFactorStatus()
        if (!isMounted) return
        setTwoFactorMethods({
          email: Boolean(data?.emailEnabled),
          app: Boolean(data?.appEnabled),
        })
      } catch {
        if (isMounted) {
          setTwoFactorMethods({ email: false, app: false })
        }
      }
    }

    loadTwoFactorStatus()

    const token = localStorage.getItem('token')
    if (!token) {
      setLastLoginText('No login activity is available yet.')
      return
    }

    try {
      const [, payload] = token.split('.')
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
      const claims = JSON.parse(atob(padded))

      if (claims?.iat) {
        const lastLogin = new Date(claims.iat * 1000)
        setLastLoginText(`Last signed in on ${lastLogin.toLocaleString()}`)
      } else {
        setLastLoginText('No login activity is available yet.')
      }
    } catch {
      setLastLoginText('No login activity is available yet.')
    }
    return () => {
      isMounted = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!showEmailOtpModal || !otpExpiresAt) return

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000))
      setOtpRemainingSeconds(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [showEmailOtpModal, otpExpiresAt])

  useEffect(() => {
    if (!showAppOtpModal || !appSetupExpiresAt) return

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((appSetupExpiresAt - Date.now()) / 1000))
      setAppSetupRemainingSeconds(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [showAppOtpModal, appSetupExpiresAt])

  const avatar = useMemo(() => {
    if (profileImage) {
      if (profileImage.startsWith('http')) return profileImage
      return `${apiOrigin}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}`
  }, [apiOrigin, profileImage, user?.email, user?.name])

  const notificationUserKey = useMemo(() => getNotificationUserKey(user), [user])

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

    setSaving(true)
    setStatus('')
    try {
      const payload = { ...user, name, email, profileImage }

      await userService.update(user.id, payload)
      await refresh()
      addNotification(notificationUserKey, {
        category: 'account',
        type: 'account-profile',
        title: 'Profile details updated',
        message: 'Your name or email details were updated successfully.',
      })
      setStatus('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      setStatus(err?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!user?.id) {
      setStatus('Missing user id. Please log in again and retry.')
      return
    }

    setSaving(true)
    setStatus('Uploading image...')
    try {
      const res = await userService.uploadAvatar(user.id, file)
      const url = res?.url
      if (url) {
        setProfileImage(url)
        await refresh()
        addNotification(notificationUserKey, {
          category: 'account',
          type: 'account-profile',
          title: 'Profile photo updated',
          message: 'Your profile photo was updated successfully.',
        })
        setStatus('Image updated successfully')
        setEditing(false)
      } else {
        setStatus('Upload did not return an image URL')
      }
    } catch (err) {
      setStatus(err?.message || 'Could not upload image')
    } finally {
      setSaving(false)
    }
  }

  const startProtectedActionTwoFactor = async (action) => {
    try {
      setSaving(true)
      setActionTwoFactorStatus('')
      const challenge = await userService.startProtectedActionChallenge(action)
      if (!challenge?.twoFactorRequired) {
        return 'NOT_REQUIRED'
      }
      setPendingTwoFactorAction(action)
      setActionChallengeId(challenge.challengeId)
      setActionChallengeMethods({
        email: Boolean(challenge?.methods?.email),
        app: Boolean(challenge?.methods?.app),
      })
      setShowActionTwoFactorModal(true)
      return 'PENDING'
    } catch (err) {
      return `ERROR:${err?.message || 'Could not start two-factor verification.'}`
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (verificationToken = null) => {
    if (!user?.id) {
      setStatus('Missing user id. Please log in again and retry.')
      return
    }

    if (!verificationToken) {
      const started = await startProtectedActionTwoFactor('DELETE_ACCOUNT')
      if (started === 'PENDING') return
      if (typeof started === 'string' && started.startsWith('ERROR:')) {
        setStatus(started.replace('ERROR:', ''))
        return
      }
    }

    const confirmed = window.confirm('Disable your account? It will be scheduled for permanent deletion in 1 month.')
    if (!confirmed) return

    setSaving(true)
    setStatus('')
    try {
      const res = await userService.disable(user.id, verificationToken ? { twoFactorToken: verificationToken } : {})
      const message = res?.message || 'Your account has been temporarily disabled. It will be permanently deleted in 1 month.'
      setStatus(message)
      await logout()
      navigate('/login', { state: { message } })
    } catch (err) {
      const message = err?.message || 'Unable to delete account'
      if (!verificationToken && message.toLowerCase().includes('two-factor verification required')) {
        const started = await startProtectedActionTwoFactor('DELETE_ACCOUNT')
        if (started === 'PENDING') return
      }
      setStatus(message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleChangePassword = async (verificationToken = null) => {
    if (!user?.id) {
      setPasswordStatus('Missing user id. Please log in again and retry.')
      return
    }

    if (!verificationToken) {
      const started = await startProtectedActionTwoFactor('CHANGE_PASSWORD')
      if (started === 'PENDING') return
      if (typeof started === 'string' && started.startsWith('ERROR:')) {
        setPasswordStatus(started.replace('ERROR:', ''))
        return
      }
    }

    if (!newPassword.trim()) {
      setPasswordStatus('Please enter a new password.')
      return
    }

    if (newPassword.trim().length < 6) {
      setPasswordStatus('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const payload = { ...user, name, email, profileImage, password: newPassword, twoFactorToken: verificationToken }
      await userService.update(user.id, payload)
      addNotification(notificationUserKey, {
        category: 'security',
        type: 'security-password',
        title: 'Password changed',
        message: 'Your account password has been changed.',
      })
      setPasswordStatus('Password changed successfully.')
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err?.message || 'Unable to change password.'
      if (!verificationToken && message.toLowerCase().includes('two-factor verification required')) {
        const started = await startProtectedActionTwoFactor('CHANGE_PASSWORD')
        if (started === 'PENDING') return
        if (typeof started === 'string' && started.startsWith('ERROR:')) {
          setPasswordStatus(started.replace('ERROR:', ''))
          return
        }
      }
      setPasswordStatus(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmailOtp = async () => {
    setSaving(true)
    setOtpStatus('')
    try {
      const res = await userService.sendEmailOtp()
      const ttl = Number(res?.expiresInSeconds) || 180
      setOtpExpiresAt(Date.now() + ttl * 1000)
      setOtpRemainingSeconds(ttl)
      setOtpStatus('Verification code sent to your email.')
    } catch (err) {
      setOtpStatus(err?.message || 'Could not send verification code.')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyEmailOtp = async () => {
    if (!otpCode.trim()) {
      setOtpStatus('Enter the OTP code you received by email.')
      return
    }

    setSaving(true)
    try {
      await userService.verifyEmailOtp(otpCode.trim())
      setTwoFactorMethods((prev) => ({ ...prev, email: true }))
      addNotification(notificationUserKey, {
        category: 'security',
        type: 'security-twofactor',
        title: 'Two-factor enabled (email)',
        message: 'Email two-factor verification has been enabled on your account.',
      })
      setTwoFactorStatus('Email two-factor authentication is enabled.')
      setOtpStatus('OTP verified successfully.')
      setShowEmailOtpModal(false)
      setOtpCode('')
      setOtpExpiresAt(null)
      setOtpRemainingSeconds(0)
    } catch (err) {
      setOtpStatus(err?.message || 'Could not verify OTP code.')
    } finally {
      setSaving(false)
    }
  }

  const openAuthenticatorSetup = async () => {
    setAppStatus('')
    setAppCode('')
    setAppQrUrl('')
    setAppSecret('')
    setAppSetupExpiresAt(null)
    setAppSetupRemainingSeconds(0)
    setShowAppOtpModal(true)

    setSaving(true)
    try {
      const setup = await userService.setupAuthenticatorApp()
      setAppQrUrl(setup?.qrUrl || '')
      setAppSecret(setup?.secret || '')
      const ttl = Number(setup?.expiresInSeconds) || 300
      setAppSetupExpiresAt(Date.now() + ttl * 1000)
      setAppSetupRemainingSeconds(ttl)
    } catch (err) {
      setAppStatus(err?.message || 'Could not load authenticator setup.')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyAuthenticatorApp = async () => {
    if (!appCode.trim()) {
      setAppStatus('Enter the authenticator app code.')
      return
    }

    setSaving(true)
    try {
      await userService.verifyAuthenticatorApp(appCode.trim())
      setTwoFactorMethods((prev) => ({ ...prev, app: true }))
      addNotification(notificationUserKey, {
        category: 'security',
        type: 'security-twofactor',
        title: 'Two-factor enabled (authenticator app)',
        message: 'Authenticator app two-factor verification has been enabled.',
      })
      setTwoFactorStatus('Authenticator app two-factor is enabled.')
      setShowAppOtpModal(false)
      setAppCode('')
      setAppQrUrl('')
      setAppSecret('')
      setAppSetupExpiresAt(null)
      setAppSetupRemainingSeconds(0)
    } catch (err) {
      setAppStatus(err?.message || 'Could not verify authenticator code.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisableEmailTwoFactor = async () => {
    setSaving(true)
    try {
      await userService.disableEmailTwoFactor()
      setTwoFactorMethods((prev) => ({ ...prev, email: false }))
      addNotification(notificationUserKey, {
        category: 'security',
        type: 'security-twofactor',
        title: 'Two-factor disabled (email)',
        message: 'Email two-factor verification has been disabled.',
      })
      setTwoFactorStatus('Email two-factor authentication is disabled.')
    } catch (err) {
      setTwoFactorStatus(err?.message || 'Could not disable email two-factor.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisableAuthenticatorApp = async () => {
    setSaving(true)
    try {
      await userService.disableAuthenticatorApp()
      setTwoFactorMethods((prev) => ({ ...prev, app: false }))
      addNotification(notificationUserKey, {
        category: 'security',
        type: 'security-twofactor',
        title: 'Two-factor disabled (authenticator app)',
        message: 'Authenticator app two-factor verification has been disabled.',
      })
      setTwoFactorStatus('Authenticator app two-factor is disabled.')
    } catch (err) {
      setTwoFactorStatus(err?.message || 'Could not disable authenticator app.')
    } finally {
      setSaving(false)
    }
  }

  const formatCountdown = (seconds) => {
    const safe = Math.max(0, seconds)
    const mins = Math.floor(safe / 60)
    const secs = safe % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const hasAnyTwoFactorEnabled = twoFactorMethods.email || twoFactorMethods.app

  const handleSendActionChallengeCode = async (method) => {
    try {
      setSaving(true)
      setActionTwoFactorStatus('')
      const res = await userService.sendProtectedActionCode({ challengeId: actionChallengeId, method })
      setActionTwoFactorStatus(res?.message || 'Verification code sent.')
    } catch (err) {
      setActionTwoFactorStatus(err?.message || 'Could not send verification code.')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifyActionChallengeCode = async ({ method, code }) => {
    try {
      setSaving(true)
      setActionTwoFactorStatus('')
      const res = await userService.verifyProtectedActionCode({ challengeId: actionChallengeId, method, code })
      const token = res?.verificationToken
      setShowActionTwoFactorModal(false)

      if (pendingTwoFactorAction === 'CHANGE_PASSWORD') {
        await handleChangePassword(token)
      } else if (pendingTwoFactorAction === 'DELETE_ACCOUNT') {
        await handleDelete(token)
      }

      setPendingTwoFactorAction('')
      setActionChallengeId('')
    } catch (err) {
      setActionTwoFactorStatus(err?.message || 'Could not verify code.')
    } finally {
      setSaving(false)
    }
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
            {email && <p className="profile-email">{email}</p>}
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

        {status && <div className="status-message">{status}</div>}

        <div className="profile-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
          <button className="btn btn-secondary" onClick={handleDelete} disabled={saving}>
            Delete Account
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSecurityModal(true)}>
            Security
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowSecurityModal(false)}
              aria-label="Close security popup"
            >
              x
            </button>
            <h3 className="modal-title">Security Center</h3>
            <p className="modal-subtitle">Review your login activity and account protection settings.</p>

            <div className="security-activity">
              <span className="security-activity-label">Last Login Activity</span>
              <span className="security-activity-value">{lastLoginText}</span>
            </div>

            {hasAnyTwoFactorEnabled && (
              <div className="security-inline-status">
                <span className="security-activity-label">Two-Factor Status</span>
                <span className="method-status enabled">Enabled</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setPasswordStatus('')
                  setShowPasswordModal(true)
                  setShowSecurityModal(false)
                }}
              >
                Change Password
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setTwoFactorStatus('')
                  setShowTwoFactorModal(true)
                  setShowSecurityModal(false)
                }}
              >
                Two-Factor
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close password popup"
            >
              x
            </button>
            <h3 className="modal-title">Change Password</h3>
            <p className="modal-subtitle">Enter your new password and confirm it.</p>

            <div className="input-group">
              <label className="input-label" htmlFor="security-new-password">New Password</label>
              <input
                id="security-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="security-confirm-password">Confirm Password</label>
              <input
                id="security-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            {passwordStatus && <div className="status-message">{passwordStatus}</div>}

            <div className="modal-actions">
              <button className="btn btn-primary" type="button" onClick={handleChangePassword} disabled={saving}>
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTwoFactorModal && (
        <div className="modal-overlay" onClick={() => setShowTwoFactorModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowTwoFactorModal(false)}
              aria-label="Close two-factor popup"
            >
              x
            </button>
            <h3 className="modal-title">Two-Factor Authentication</h3>
            <p className="modal-subtitle">Choose your preferred second verification method.</p>

            <div className="twofactor-grid">
              <button
                className="twofactor-card twofactor-card-clickable"
                type="button"
                onClick={() => {
                  setOtpStatus('')
                  setOtpCode('')
                  setOtpExpiresAt(null)
                  setOtpRemainingSeconds(0)
                  setShowEmailOtpModal(true)
                }}
              >
                <h4>Email Verification</h4>
                <p>Receive one-time codes via your registered email address.</p>
                <span className={`method-status ${twoFactorMethods.email ? 'enabled' : 'disabled'}`}>
                  {twoFactorMethods.email ? 'Enabled' : 'Disabled'}
                </span>
                {twoFactorMethods.email && (
                  <button
                    className="method-disable-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDisableEmailTwoFactor()
                    }}
                    disabled={saving}
                  >
                    Disable
                  </button>
                )}
              </button>

              <button
                className="twofactor-card twofactor-card-clickable"
                type="button"
                onClick={openAuthenticatorSetup}
              >
                <h4>Authenticator App</h4>
                <p>Use Google Authenticator or any compatible TOTP app.</p>
                <span className={`method-status ${twoFactorMethods.app ? 'enabled' : 'disabled'}`}>
                  {twoFactorMethods.app ? 'Enabled' : 'Disabled'}
                </span>
                {twoFactorMethods.app && (
                  <button
                    className="method-disable-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDisableAuthenticatorApp()
                    }}
                    disabled={saving}
                  >
                    Disable
                  </button>
                )}
              </button>
            </div>

            {twoFactorStatus && <div className="status-message">{twoFactorStatus}</div>}
          </div>
        </div>
      )}

      {showEmailOtpModal && (
        <div className="modal-overlay" onClick={() => setShowEmailOtpModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowEmailOtpModal(false)}
              aria-label="Close email verification popup"
            >
              x
            </button>
            <h3 className="modal-title">Email Verification</h3>
            <p className="modal-subtitle">Verify your email to enable two-factor authentication.</p>

            <div className="security-activity">
              <span className="security-activity-label">Email</span>
              <span className="security-activity-value">{user?.email || email}</span>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={handleSendEmailOtp} disabled={saving}>
                {saving ? 'Sending...' : 'Verify'}
              </button>
            </div>

            {otpExpiresAt && (
              <div className="otp-timer">Code expires in {formatCountdown(otpRemainingSeconds)}</div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email-otp-code">Enter Received OTP Code</label>
              <input
                id="email-otp-code"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP"
              />
            </div>

            {otpStatus && <div className="status-message">{otpStatus}</div>}

            <div className="modal-actions">
              <button className="btn btn-primary" type="button" onClick={handleVerifyEmailOtp} disabled={saving}>
                {saving ? 'Verifying...' : 'Submit OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppOtpModal && (
        <div className="modal-overlay" onClick={() => setShowAppOtpModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowAppOtpModal(false)}
              aria-label="Close authenticator popup"
            >
              x
            </button>
            <h3 className="modal-title">Authenticator App Setup</h3>
            <p className="modal-subtitle">Scan the QR code in Google Authenticator, then enter the 6-digit code.</p>

            {appQrUrl && (
              <div className="qr-wrap">
                <img className="qr-image" src={appQrUrl} alt="Authenticator setup QR code" />
              </div>
            )}

            {appSecret && (
              <div className="security-activity">
                <span className="security-activity-label">Manual Setup Key</span>
                <span className="security-activity-value secret-code">{appSecret}</span>
              </div>
            )}

            {appSetupExpiresAt && (
              <div className="otp-timer">Setup expires in {formatCountdown(appSetupRemainingSeconds)}</div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="auth-app-code">Authenticator Code</label>
              <input
                id="auth-app-code"
                type="text"
                value={appCode}
                onChange={(e) => setAppCode(e.target.value)}
                placeholder="Enter 6-digit code"
              />
            </div>

            {appStatus && <div className="status-message">{appStatus}</div>}

            <div className="modal-actions">
              <button className="btn btn-primary" type="button" onClick={handleVerifyAuthenticatorApp} disabled={saving}>
                {saving ? 'Verifying...' : 'Verify App'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TwoFactorChallengeModal
        open={showActionTwoFactorModal}
        title={pendingTwoFactorAction === 'DELETE_ACCOUNT' ? 'Delete Account Verification' : 'Change Password Verification'}
        subtitle="Choose a method and verify to continue this action."
        methods={actionChallengeMethods}
        status={actionTwoFactorStatus}
        loading={saving}
        onClose={() => setShowActionTwoFactorModal(false)}
        onSendCode={handleSendActionChallengeCode}
        onVerify={handleVerifyActionChallengeCode}
      />
    </div>
  )
}