import { useState } from 'react'
import { KeyRound, LogOut, Pencil, Plus, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { Alert, ErrorBox, Field, Modal, Spinner } from '../components/ui'
import { fmtDateTime, titleCase } from '../utils'

const ROLES = [
  ['lab_technician', 'Lab technician / front desk'],
  ['phlebotomist', 'Phlebotomist (home collection)'],
  ['admin', 'Admin (manager)'],
]

const OWNER_ROLE = ['owner', 'Owner (runs the business, creates staff)']
const rolesFor = (actorRole) => (actorRole === 'master' ? [OWNER_ROLE, ...ROLES] : ROLES)

function NewStaffForm({ roles, onDone }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', role: 'lab_technician', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onDone(await api.post('/owner/staff', f))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      <ErrorBox error={error} />
      <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} required /></Field>
      <Field label="Work email (used to sign in)"><input className="input" type="email" value={f.email} onChange={set('email')} placeholder="name@mohullabs.in" required /></Field>
      <Field label="Role">
        <select className="input" value={f.role} onChange={set('role')}>{roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Field>
      <Field label="First password (give it to them; at least 8 characters)">
        <input className="input" type="text" value={f.password} onChange={set('password')} autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Contact phone (optional, not used to sign in)">
        <input className="input" value={f.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </div>
    </form>
  )
}

export default function StaffAccounts() {
  const { user } = useAuth()
  const isMaster = user.role === 'master'
  const roles = rolesFor(user.role)
  const list = useFetch('/owner/staff')
  const [modal, setModal] = useState(null) // { kind: 'new' | 'edit' | 'password', staff? }
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState(null)

  const run = async (fn, done) => {
    setError(null)
    setMsg('')
    try {
      await fn()
      setMsg(done)
      setModal(null)
      list.reload()
    } catch (err) {
      setError(err)
    }
  }
  const toggleActive = (s) => {
    const verb = s.is_active ? 'Deactivate' : 'Reactivate'
    if (!window.confirm(`${verb} ${s.name}?${s.is_active ? ' They will be signed out immediately and cannot sign in again.' : ''}`)) return
    run(() => api.patch(`/owner/staff/${s.id}`, { name: s.name, role: s.role, is_active: !s.is_active }),
      `${s.name} ${s.is_active ? 'deactivated and signed out' : 'reactivated'}.`)
  }
  const signOut = (s) => {
    if (!window.confirm(`Sign ${s.name} out on every device?`)) return
    run(() => api.post(`/owner/staff/${s.id}/sign-out`), `${s.name} was signed out everywhere.`)
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row-between">
        <div>
          <h2>{isMaster ? 'Owners & staff' : 'Staff accounts'}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {isMaster ? 'As master you create owner profiles; each owner then creates their own staff.'
              : 'Only you (the owner) can add staff, change roles, reset passwords or remove access.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal({ kind: 'new' }); setError(null) }}><Plus size={16} /> {isMaster ? 'Add owner or staff' : 'Add staff'}</button>
      </div>
      <Alert kind="info">
        Staff sign in with a work email and the password you give them — not their own phone. When someone leaves,
        <strong> Deactivate</strong> them: they are signed out on every device at once.
      </Alert>
      {msg && <Alert kind="ok">{msg}</Alert>}
      {!modal && <ErrorBox error={error} />}
      {list.loading ? <Spinner /> : list.error ? <ErrorBox error={list.error} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead>
            <tbody>
              {list.data.map((s) => {
                const self = s.id === user.id || s.role === 'master' || (s.role === 'owner' && !isMaster)
                return (
                  <tr key={s.id} style={s.is_active ? undefined : { opacity: 0.6 }}>
                    <td><strong>{s.name}</strong>{s.phone && <div className="small muted">{s.phone}</div>}</td>
                    <td className="small">{s.email}</td>
                    <td>{s.role === 'master' ? <span className="badge badge-blue"><ShieldCheck size={12} /> Master</span>
                      : s.role === 'owner' ? <span className="badge"><ShieldCheck size={12} /> Owner</span> : titleCase(s.role)}</td>
                    <td><span className={`badge ${s.is_active ? 'badge-ok' : 'badge-grey'}`}>{s.is_active ? 'Active' : 'Deactivated'}</span></td>
                    <td className="small muted">{s.last_login_at ? fmtDateTime(s.last_login_at) : 'Never'}</td>
                    <td>
                      {!self && (
                        <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                          <button className="btn btn-ghost btn-sm" title="Edit name / role" onClick={() => { setForm({ name: s.name, role: s.role }); setModal({ kind: 'edit', staff: s }); setError(null) }}><Pencil size={15} /></button>
                          <button className="btn btn-ghost btn-sm" title="Reset password" onClick={() => { setForm({ password: '' }); setModal({ kind: 'password', staff: s }); setError(null) }}><KeyRound size={15} /></button>
                          {s.is_active && <button className="btn btn-ghost btn-sm" title="Sign out everywhere" onClick={() => signOut(s)}><LogOut size={15} /></button>}
                          <button className={`btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-outline'}`} onClick={() => toggleActive(s)}>
                            {s.is_active ? <><UserX size={15} /> Deactivate</> : <><UserCheck size={15} /> Reactivate</>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal?.kind === 'new' && (
        <Modal title={isMaster ? 'Add owner or staff' : 'Add staff member'} onClose={() => setModal(null)}>
          <NewStaffForm roles={roles} onDone={(u) => { setModal(null); setMsg(`Account created for ${u.name}. Give them their email and password.`); list.reload() }} />
        </Modal>
      )}
      {modal?.kind === 'edit' && (
        <Modal title={`Edit ${modal.staff.name}`} onClose={() => setModal(null)}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); run(() => api.patch(`/owner/staff/${modal.staff.id}`, { ...form, is_active: modal.staff.is_active }), `${form.name} updated.`) }}>
            <ErrorBox error={error} />
            <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Role">
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </Field>
            {form.role !== modal.staff.role && <Alert kind="warn">Changing the role signs them out so the new role takes effect.</Alert>}
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'password' && (
        <Modal title={`Reset password for ${modal.staff.name}`} onClose={() => setModal(null)}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/owner/staff/${modal.staff.id}/password`, form), `New password set for ${modal.staff.name}; they were signed out everywhere.`) }}>
            <ErrorBox error={error} />
            <Field label="New password (at least 8 characters)">
              <input className="input" type="text" value={form.password} onChange={(e) => setForm({ password: e.target.value })} autoComplete="new-password" minLength={8} required />
            </Field>
            <Alert kind="info">They will be signed out on every device and must use the new password.</Alert>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary">Set password</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}
