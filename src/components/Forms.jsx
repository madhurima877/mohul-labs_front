import { useState } from 'react'
import { api } from '../api'
import { ErrorBox, Field } from './ui'

const RELATIONS = ['self', 'spouse', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'other']

export function PatientForm({ initial, onSaved, onCancel }) {
  const [f, setF] = useState(initial || { name: '', gender: 'female', dob: '', relation: 'self' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body = { name: f.name, gender: f.gender, dob: f.dob.slice(0, 10), relation: f.relation }
      const saved = initial?.id ? await api.put(`/patients/${initial.id}`, body) : await api.post('/patients', body)
      onSaved(saved)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <ErrorBox error={error} />
      <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} required maxLength={120} /></Field>
      <div className="form-grid">
        <Field label="Gender">
          <select className="input" value={f.gender} onChange={set('gender')}>
            <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
          </select>
        </Field>
        <Field label="Date of birth"><input className="input" type="date" value={f.dob.slice(0, 10)} onChange={set('dob')} required max={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Relation">
          <select className="input" value={f.relation} onChange={set('relation')}>
            {RELATIONS.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
          </select>
        </Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save member'}</button>
      </div>
    </form>
  )
}

export function AddressForm({ onSaved, onCancel }) {
  const [f, setF] = useState({ line1: '', line2: '', landmark: '', city: 'Kolkata', state: 'West Bengal', pincode: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onSaved(await api.post('/addresses', f))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <ErrorBox error={error} />
      <Field label="House / flat, street"><input className="input" value={f.line1} onChange={set('line1')} required /></Field>
      <Field label="Area (optional)"><input className="input" value={f.line2} onChange={set('line2')} /></Field>
      <div className="form-grid">
        <Field label="Landmark (optional)"><input className="input" value={f.landmark} onChange={set('landmark')} /></Field>
        <Field label="Pincode"><input className="input" value={f.pincode} onChange={set('pincode')} required pattern="[1-9][0-9]{5}" inputMode="numeric" maxLength={6} /></Field>
        <Field label="City"><input className="input" value={f.city} onChange={set('city')} required /></Field>
        <Field label="State"><input className="input" value={f.state} onChange={set('state')} required /></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
      </div>
    </form>
  )
}
