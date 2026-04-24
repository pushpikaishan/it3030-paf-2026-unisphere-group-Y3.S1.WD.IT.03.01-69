import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [verifiedCode, setVerifiedCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('request')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [doneNotice, setDoneNotice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const doneTimerRef = useRef(null)

  const remainingSeconds = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.ceil((expiresAt - now) / 1000))
  }, [expiresAt, now])

  const isCodeStep = step === 'verify' || step === 'reset'

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current)
        doneTimerRef.current = null
      }
      setEmail('')
      setCode('')
      setVerifiedCode('')
      setNewPassword('')
      setConfirmPassword('')
      setStep('request')
      setStatus('')
      setError('')
      setDoneNotice(false)
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

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current)
      }
    }
  }, [])

  if (!open) return null

  const sendCode = async () => {
    try {
      setLoading(true)
      setError('')
      setStatus('')
      const res = await userService.sendForgotPasswordCode({ email: email.trim() })
      const ttl = Number(res?.expiresInSeconds) || DEFAULT_EXPIRES_SECONDS
      setExpiresAt(Date.now() + ttl * 1000)
      setStep('verify')
      setStatus(res?.message || 'Code sent. Check your email inbox.')
    } catch (err) {
      setError(err.message || 'Could not send reset code.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    try {
      setLoading(true)
      setError('')
      setStatus('')
      await userService.verifyForgotPasswordCode({
        email: email.trim(),
        code: code.trim(),
      })
      setVerifiedCode(code.trim())
      setCode('')
      setStep('reset')
      setStatus('')
    } catch (err) {
      setError(err.message || 'Could not verify reset code.')
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
      await userService.resetForgotPassword({
        email: email.trim(),
        code: verifiedCode,
        newPassword,
      })
      setStatus('')
      setStep('request')
      setEmail('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setVerifiedCode('')
      setExpiresAt(null)
      setDoneNotice(true)
      doneTimerRef.current = window.setTimeout(() => {
        setDoneNotice(false)
        doneTimerRef.current = null
        onClose()
      }, 5000)
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
          {step === 'request' && 'Enter your email and we will send a reset code.'}
          {step === 'verify' && 'Enter the reset code to verify your request.'}
          {step === 'reset' && 'Code verified. Set your new password.'}
        </p>

        {step !== 'reset' && (
          <div className="input-group">
            <label className="input-label" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={step !== 'request' || loading}
            />
          </div>
        )}

        {step === 'request' && (
          <div className="modal-actions">
            <button className="btn btn-primary" type="button" disabled={!email.trim() || loading} onClick={sendCode}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
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

            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" disabled={loading} onClick={sendCode}>
                {loading ? 'Please wait...' : 'Resend Code'}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!code.trim() || loading || remainingSeconds <= 0}
                onClick={verifyCode}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
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
              <button
                className="btn btn-primary"
                type="button"
                disabled={!newPassword || !confirmPassword || !verifiedCode || loading || remainingSeconds <= 0}
                onClick={resetPassword}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}

        {status && <div className="status-message">{status}</div>}
        {error && <p className="error">{error}</p>}
        {doneNotice && <div className="forgot-done-toast">Done. Now you can login with new password.</div>}
      </div>
    </div>
  )
}
