import { useState } from 'react'
import { MapPin, Pencil, Plus, Trash2, User } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { AddressForm, PatientForm } from '../components/Forms'
import { Alert, Empty, ErrorBox, Field, Modal, Spinner } from '../components/ui'
import { age } from '../utils'

export default function Profile() {
  const { user, setUser } = useAuth()
  const patients = useFetch('/patients')
  const addresses = useFetch('/addresses')
  const [modal, setModal] = useState(null)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email || '')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState(null)

  const saveProfile = async (e) => {
    e.preventDefault()
    setError(null)
    setMsg('')
    try {
      setUser(await api.patch('/me', { name, email }))
      setMsg('Profile saved')
    } catch (err) {
      setError(err)
    }
  }
  const remove = async (path, reload, label) => {
    if (!window.confirm(`Remove ${label}?`)) return
    try {
      await api.del(path)
      reload()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="container section-sm">
      <h1>Family & addresses</h1>
      <ErrorBox error={error} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', marginTop: 16, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 18 }}>
          <form className="card stack" onSubmit={saveProfile}>
            <h3>Your profile</h3>
            {msg && <Alert kind="ok">{msg}</Alert>}
            <Field label="Mobile"><input className="input" value={`+91 ${user.phone}`} disabled /></Field>
            <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Email (optional)"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button className="btn btn-primary" style={{ alignSelf: 'start' }}>Save</button>
          </form>

          <div className="card">
            <div className="row-between"><h3>Addresses</h3><button className="btn btn-outline btn-sm" onClick={() => setModal({ kind: 'address' })}><Plus size={15} /> Add</button></div>
            {addresses.loading ? <Spinner /> : (addresses.data || []).length === 0 ? <p className="muted small">No saved addresses.</p> : addresses.data.map((a) => (
              <div key={a.id} className="list-row">
                <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'start' }}>
                  <MapPin size={18} color="var(--brand-600)" style={{ marginTop: 3 }} />
                  <div><strong>{a.line1}</strong><div className="small muted">{[a.line2, a.city, a.pincode].filter(Boolean).join(', ')}</div></div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(`/addresses/${a.id}`, addresses.reload, 'this address')} aria-label="Delete address"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row-between"><h3>Family members</h3><button className="btn btn-outline btn-sm" onClick={() => setModal({ kind: 'patient' })}><Plus size={15} /> Add</button></div>
          <p className="small muted">Book tests and dental visits for anyone listed here.</p>
          {patients.loading ? <Spinner /> : (patients.data || []).length === 0 ? (
            <Empty icon={User} title="No family members yet" />
          ) : patients.data.map((p) => (
            <div key={p.id} className="list-row">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <span className="icon-bubble" style={{ width: 40, height: 40 }}><User size={18} /></span>
                <div><strong>{p.name}</strong><div className="small muted">{p.relation} · {p.gender} · {age(p.dob)} yrs</div></div>
              </div>
              <div className="row" style={{ gap: 2 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ kind: 'patient', item: p })} aria-label="Edit"><Pencil size={15} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(`/patients/${p.id}`, patients.reload, p.name)} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal?.kind === 'patient' && (
        <Modal title={modal.item ? 'Edit family member' : 'Add family member'} onClose={() => setModal(null)}>
          <PatientForm initial={modal.item} onCancel={() => setModal(null)} onSaved={() => { setModal(null); patients.reload() }} />
        </Modal>
      )}
      {modal?.kind === 'address' && (
        <Modal title="New address" onClose={() => setModal(null)}>
          <AddressForm onCancel={() => setModal(null)} onSaved={() => { setModal(null); addresses.reload() }} />
        </Modal>
      )}
    </div>
  )
}
