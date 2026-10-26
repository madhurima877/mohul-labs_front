import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BadgeCheck, Clock, Eye, EyeOff, KeyRound, LogIn, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { Alert, ErrorBox, Field } from '../components/ui'

// Staff sign in with the work email and password the owner gave them, against the separate staff
// service. The session then stays open for the whole shift while the portal is open.
export default function StaffLogin() {
  const { user, login } = useAuth()
  const [ended] = useState(() => {
    try {
      const v = sessionStorage.getItem('mohul_session_ended')
      sessionStorage.removeItem('mohul_session_ended')
      return Boolean(v)
    } catch {
      return false
    }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user && user.role !== 'customer') return <Navigate to="/staff" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.post('/auth/login', { email, password }, 'staff')
      login(res.access_token, res.user, 'staff')
    } catch (err) {
      setError(err)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-art" style={{ background: 'linear-gradient(135deg, #2e1a47 0%, #5b2a86 55%, #1d7246 100%)' }}>
        <span className="badge" style={{ alignSelf: 'start', background: 'rgba(255,255,255,.15)', color: '#fff' }}>Staff only</span>
        <h2 style={{ marginTop: 12 }}>Mohul Labs staff portal</h2>
        <p>Front desk, sample collection, lab results and the dental desk.</p>
        <ul>
          <li><KeyRound size={20} /> Sign in with the work email and password from the owner</li>
          <li><Clock size={20} /> Stays signed in for your whole shift while this window is open</li>
          <li><ShieldCheck size={20} /> Runs on its own service, separate from the customer website</li>
          <li><BadgeCheck size={20} /> Only the owner can create, change or remove staff accounts</li>
        </ul>
      </div>
      <div className="auth-form">
        <form className="card stack" onSubmit={submit}>
          <div className="row" style={{ gap: 10 }}>
            <span className="icon-bubble" style={{ width: 40, height: 40 }}><KeyRound size={20} /></span>
            <h2 style={{ margin: 0 }}>Staff sign in</h2>
          </div>
          {ended && <Alert kind="warn">Your session ended. The owner may have changed your account — sign in again.</Alert>}
          {user?.role === 'customer' && <Alert kind="info">You're signed in as a customer. Signing in here switches this browser to the staff portal.</Alert>}
          <ErrorBox error={error} />
          <Field label="Work email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="name@mohullabs.in" autoFocus required />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required style={{ paddingRight: 44 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 4, top: 4 }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy || !email || !password}><LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="small muted" style={{ margin: 0 }}>Forgot your password? Ask the owner to reset it.</p>
        </form>
      </div>
    </div>
  )
}
