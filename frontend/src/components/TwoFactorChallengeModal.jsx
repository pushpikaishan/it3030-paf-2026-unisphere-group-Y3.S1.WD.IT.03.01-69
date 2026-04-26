import { useEffect, useState } from 'react'

export default function TwoFactorChallengeModal({
  open,
  title,
  subtitle,
  methods,
  status,
  loading,
  onClose,
  onSendCode,
  onVerify,
}) {
  const [selectedMethod, setSelectedMethod] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!open) return
    if (methods?.email) {
      setSelectedMethod('EMAIL')
    } else if (methods?.app) {
      setSelectedMethod('APP')
    } else {
      setSelectedMethod('')
    }
    setCode('')
  }, [open, methods?.email, methods?.app])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close two-factor popup">
          x
        </button>
        <h3 className="modal-title">{title || 'Two-Factor Verification'}</h3>
        <p className="modal-subtitle">{subtitle || 'Choose a method and verify your code to continue.'}</p>

        <div className="method-choice-grid">
          {methods?.email && (
            <button
              type="button"
              className={`method-choice-btn ${selectedMethod === 'EMAIL' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('EMAIL')}
            >
              Email
            </button>
          )}
          {methods?.app && (
            <button
              type="button"
              className={`method-choice-btn ${selectedMethod === 'APP' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('APP')}
            >
              Authenticator App
            </button>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={!selectedMethod || loading}
            onClick={() => onSendCode?.(selectedMethod)}
          >
            {loading ? 'Sending...' : selectedMethod === 'APP' ? 'Use App Code' : 'Send Code'}
          </button>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="twofactor-code">Verification Code</label>
          <input
            id="twofactor-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter verification code"
          />
        </div>

        {status && <div className="status-message">{status}</div>}

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={!selectedMethod || !code.trim() || loading}
            onClick={() => onVerify?.({ method: selectedMethod, code: code.trim() })}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  )
}
