import { useState } from 'react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Empty, ErrorBox, Field, Modal, Spinner, StatusBadge } from '../components/ui'
import { fmtDate, fmtTime, isoDate, rupees } from '../utils'

const NEXT = {
  booked: [['checked_in', 'Check in', 'btn-brand'], ['no_show', 'No-show', 'btn-ghost'], ['cancelled', 'Cancel', 'btn-danger']],
  checked_in: [['completed', 'Complete visit', 'btn-primary']],
}

export default function AdminDental() {
  const [date, setDate] = useState(isoDate(new Date()))
  const [status, setStatus] = useState('')
  const appts = useFetch(`/admin/dental/appointments?date=${date}&status=${status}`)
  const [action, setAction] = useState(null) // { appt, to, label }
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)

  const submit = async () => {
    setError(null)
    try {
      await api.post(`/admin/dental/appointments/${action.appt.id}/status`, { status: action.to, notes })
      setAction(null)
      setNotes('')
      appts.reload()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div><h2>Dental appointments</h2><p className="muted" style={{ margin: 0 }}>Check patients in and record the dentist's notes.</p></div>
        <div className="row">
          <select className="input" style={{ width: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['booked', 'checked_in', 'completed', 'no_show', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <input className="input" type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <ErrorBox error={error && !action ? error : null} />
      {appts.loading ? <Spinner /> : (appts.data || []).length === 0 ? <Empty title={`No appointments on ${fmtDate(date)}`} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Time</th><th>Patient</th><th>Treatment</th><th>Dentist</th><th>Complaint</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {appts.data.map((a) => (
                <tr key={a.id}>
                  <td><strong>{fmtTime(a.start_time)}</strong><div className="small muted">{a.appointment_no}</div></td>
                  <td>{a.patient_name}</td>
                  <td>{a.service_name}<div className="small muted">{rupees(a.price_paise)}</div></td>
                  <td>{a.dentist_name}<div className="small muted">{a.lab_name}</div></td>
                  <td className="small" style={{ maxWidth: 220 }}>{a.notes || '—'}{a.dentist_notes && <div style={{ color: 'var(--brand-700)' }}>Rx: {a.dentist_notes}</div>}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      {(NEXT[a.status] || []).map(([to, label, cls]) => (
                        <button key={to} className={`btn btn-sm ${cls}`} onClick={() => { setAction({ appt: a, to, label }); setNotes(''); setError(null) }}>{label}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {action && (
        <Modal title={`${action.label}: ${action.appt.patient_name}`} onClose={() => setAction(null)}>
          <div className="stack">
            <ErrorBox error={error} />
            <p className="small muted">{action.appt.service_name} with {action.appt.dentist_name} at {fmtTime(action.appt.start_time)}</p>
            {action.to !== 'checked_in' && (
              <Field label={action.to === 'cancelled' ? 'Reason' : "Dentist's notes / prescription"}>
                <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={action.to === 'completed' ? 'e.g. RCT done on 36. Review after 7 days. Ibuprofen 400mg SOS.' : ''} />
              </Field>
            )}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setAction(null)}>Back</button>
              <button className="btn btn-primary" onClick={submit}>{action.label}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
