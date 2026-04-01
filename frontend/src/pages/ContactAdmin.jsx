import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import logo from '../assets/images/unisphere.png'
import './css/profile.css'

export default function ContactAdmin() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const { pathname } = useLocation()

  const backHref = pathname.includes('login') ? '/login' : pathname.includes('register') ? '/register' : '/login'
  const backLabel = backHref === '/register' ? 'Back to register' : 'Back to login'

  const submit = (e) => {
    e.preventDefault()
    setStatus('')
    if (!email || !message) {
      setStatus('Please add your email and message.')
      return
    }
    setStatus('Thanks! Your message was noted — an admin will reach out soon.')
    setEmail('')
    setMessage('')
  }

  return (
    <div className="auth-shell" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="auth-hero">
        <div className="auth-hero-glass">
          <img className="auth-logo" src={logo} alt="UniSphere" />
          <p className="auth-eyebrow">Need assistance?</p>
          <h1>Contact Admin</h1>
          <p className="auth-subhead">Send us your request and we will get back to you shortly.</p>
        </div>
      </div>

      <div className="auth-panel">
        <h2>Send a message</h2>
        <p className="muted">Provide your email and a brief message so we can assist.</p>
        <form className="stack" onSubmit={submit}>
          <input
            required
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            required
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <button className="button" type="submit">
            Send message
          </button>
          {status && <p className="muted">{status}</p>}
        </form>
        <div className="auth-footer">
          <Link className="link-button" to={backHref}>
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}