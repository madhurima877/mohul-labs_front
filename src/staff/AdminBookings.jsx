import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Empty, ErrorBox, Spinner, StatusBadge } from '../components/ui'
import { fmtDate, fmtTime, rupees, titleCase } from '../utils'

const STATUSES = ['', 'booked', 'phlebotomist_assigned', 'sample_collected', 'received_at_lab', 'processing', 'recollection_required', 'report_ready', 'cancelled']
const ASSIGNABLE = ['booked', 'phlebotomist_assigned', 'recollection_required']

export default function AdminBookings() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const date = params.get('date') || ''
  const bookings = useFetch(`/admin/bookings?limit=100&status=${status}&date=${date}`)
  const phlebos = useFetch('/admin/users?role=phlebotomist')
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState('')

  const set = (k, v) => {
    const next = Object.fromEntries(params)
    if (v) next[k] = v
    else delete next[k]
    setParams(next)
  }

  const assign = async (b, phleboId) => {
    if (!phleboId) return
    setError(null)
    try {
      await api.post(`/admin/bookings/${b.id}/assign`, { phlebotomist_id: phleboId })
      setMsg(`${b.booking_no} assigned`)
      bookings.reload()
    } catch (err) {
      setError(err)
    }
  }

  const list = bookings.data?.items || []
  return (
    <div className="stack">
      <div className="row-between">
        <div><h2>Lab bookings</h2><p className="muted" style={{ margin: 0 }}>Assign phlebotomists to home collections.</p></div>
        <div className="row">
          <select className="input" style={{ width: 210 }} value={status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s ? titleCase(s) : 'All statuses'}</option>)}
          </select>
          <input className="input" type="date" style={{ width: 170 }} value={date} onChange={(e) => set('date', e.target.value)} />
        </div>
      </div>
      <ErrorBox error={error} />
      {msg && <p className="small" style={{ color: 'var(--ok)', fontWeight: 650 }}>{msg}</p>}
      {bookings.loading ? <Spinner /> : list.length === 0 ? <Empty title="No bookings match" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Booking</th><th>Slot</th><th>Type</th><th>Total</th><th>Payment</th><th>Status</th><th>Phlebotomist</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td><Link to={`/account/bookings/${b.id}`}>{b.booking_no}</Link></td>
                  <td>{fmtDate(b.slot_date)}<div className="small muted">{fmtTime(b.slot_start)}</div></td>
                  <td>{b.collection_type === 'home' ? 'Home' : 'Centre'}</td>
                  <td>{rupees(b.total_paise)}</td>
                  <td><span className={`badge ${b.payment_status === 'paid' ? 'badge-ok' : 'badge-warn'}`}>{titleCase(b.payment_status)}</span> <span className="small muted">{b.payment_mode}</span></td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {b.collection_type === 'home' && ASSIGNABLE.includes(b.status) ? (
                      <select className="input" style={{ minWidth: 170, padding: '6px 10px' }} value={b.status === 'recollection_required' ? '' : b.phlebotomist_id || ''} onChange={(e) => assign(b, e.target.value)}>
                        <option value="">{b.status === 'recollection_required' ? 'Reassign for recollection…' : 'Assign…'}</option>
                        {(phlebos.data || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    ) : <span className="muted small">{b.phlebotomist_id ? (phlebos.data || []).find((p) => p.id === b.phlebotomist_id)?.name || 'Assigned' : '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
