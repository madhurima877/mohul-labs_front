import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Phone } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { Alert, ErrorBox, Field } from '../components/ui'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) return <Navigate to={user.role === 'customer' ? location.state?.from || '/' : '/staff'} replace />

  const requestOtp = async (e) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setSent(await api.post('/auth/otp/request', { phone }))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.post('/auth/otp/verify', { phone, otp, name })
      login(res.access_token, res.user)
      const dest = res.user.role !== 'customer' ? '/staff' : location.state?.from || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <h2>Your health, one login.</h2>
        <p>Book lab tests and dental visits for your whole family and keep every report in one place.</p>
        <ul>
          <li><CheckCircle2 size={20} /> Free home sample collection on {'₹'}1,000+</li>
          <li><CheckCircle2 size={20} /> Online reports with abnormal values highlighted</li>
          <li><CheckCircle2 size={20} /> Dental appointments with experienced dentists</li>
        </ul>
      </div>
      <div className="auth-form">
        <div className="card">
          <h2>{sent ? 'Enter OTP' : 'Login or sign up'}</h2>
          <p className="muted small">{sent ? `We sent a 6-digit code to +91 ${phone}.` : 'We will send a one-time password to your mobile.'}</p>
          <ErrorBox error={error} />
          {!sent ? (
            <form className="stack" onSubmit={requestOtp}>
              <Field label="Mobile number">
                <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                  <span className="input" style={{ width: 64, textAlign: 'center', background: 'var(--teal-50)' }}>+91</span>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="98765 43210" autoFocus required />
                </div>
              </Field>
              <button className="btn btn-primary btn-block" disabled={busy || phone.length !== 10}><Phone size={16} /> {busy ? 'Sending…' : 'Get OTP'}</button>
            </form>
          ) : (
            <form className="stack" onSubmit={verify}>
              {sent.dev_otp && <Alert kind="info">Development mode — your OTP is <span className="kbd">{sent.dev_otp}</span></Alert>}
              <Field label="OTP">
                <input className="input otp-input" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus required />
              </Field>
              <Field label="Your name (for new accounts)">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional if you have an account" />
              </Field>
              <button className="btn btn-primary btn-block" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
              <div className="row-between small">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSent(null); setOtp('') }}>Change number</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={requestOtp} disabled={busy}>Resend OTP</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
