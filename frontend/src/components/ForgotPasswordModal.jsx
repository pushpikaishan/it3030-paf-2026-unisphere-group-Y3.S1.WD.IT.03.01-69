import { useEffect, useMemo, useState } from 'react'
import { userService } from '../services/userService'

const DEFAULT_EXPIRES_SECONDS = 180

const toMMSS = (seconds) => {
  const safe = Math.max(0, seconds)
  const mm = String(Math.floor(safe / 60)).padStart(2, '0')
  const ss = String(safe % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(null)
  const [now, setNow] = useState(Date.now())

  const remainingSeconds = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.ceil((expiresAt - now) / 1000))
  }, [expiresAt, now])

  const isCodeStep = Boolean(expiresAt)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus('')
      setError('')
      setLoading(false)
      setExpiresAt(null)
      setNow(Date.now())
      return
    }

    if (!isCodeStep) return
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [open, isCodeStep])

  if (!open) return null

  const sendCode = async () => {
    try {
      setLoading(true)
      setError('')
      setStatus('')
      const res = await userService.sendForgotPasswordCode({ email: email.trim() })
      const ttl = Number(res?.expiresInSeconds) || DEFAULT_EXPIRES_SECONDS
      setExpiresAt(Date.now() + ttl * 1000)
      setStatus(res?.message || 'Code sent. Check your email inbox.')
    } catch (err) {
      setError(err.message || 'Could not send reset code.')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setStatus('')
      const res = await userService.resetForgotPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      setStatus(res?.message || 'Password updated successfully. You can now log in.')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setExpiresAt(null)
    } catch (err) {
      setError(err.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close forgot password popup">
          x
        </button>

        <h3 className="modal-title">Forgot Password</h3>
        <p className="modal-subtitle">
          {isCodeStep
            ? 'Enter the code from your email and set a new password.'
            : 'Enter your email and we will send a reset code.'}
        </p>

        <div className="input-group">
          <label className="input-label" htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isCodeStep || loading}
          />
        </div>

        {!isCodeStep && (
          <div className="modal-actions">
            <button className="btn btn-primary" type="button" disabled={!email.trim() || loading} onClick={sendCode}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        )}

        {isCodeStep && (
          <>
            <p className="otp-timer">Code expires in {toMMSS(remainingSeconds)}</p>

            <div className="input-group">
              <label className="input-label" htmlFor="forgot-code">Reset Code</label>
              <input
                id="forgot-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="forgot-new-password">New Password</label>
              <input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="forgot-confirm-password">Confirm New Password</label>
              <input
                id="forgot-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" disabled={loading} onClick={sendCode}>
                {loading ? 'Please wait...' : 'Resend Code'}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!code.trim() || !newPassword || !confirmPassword || loading || remainingSeconds <= 0}
                onClick={resetPassword}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}

        {status && <div className="status-message">{status}</div>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
