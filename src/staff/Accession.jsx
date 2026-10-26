import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ScanBarcode } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Alert, Empty, ErrorBox, Field, Modal, Spinner } from '../components/ui'
import { fmtDateTime, isoDate, SAMPLE_LABELS } from '../utils'
import { CollectCard } from './Collections'

const REJECT_REASONS = ['Haemolysed', 'Clotted', 'Insufficient quantity', 'Wrong tube', 'Label mismatch', 'Leaked in transit']

export default function Accession() {
  const transit = useFetch('/lab/samples?status=collected&limit=100')
  const walkins = useFetch(`/lab/bookings?date=${isoDate(new Date())}&limit=100`)
  const [barcode, setBarcode] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState(REJECT_REASONS[0])

  const receive = async (code) => {
    setError(null)
    setMsg(null)
    try {
      const s = await api.post(`/lab/samples/${encodeURIComponent(code.trim())}/receive`)
      setMsg(`${s.barcode} received (${SAMPLE_LABELS[s.sample_type]})`)
      setBarcode('')
      transit.reload()
    } catch (err) {
      setError(err)
    }
  }
  const reject = async () => {
    setError(null)
    try {
      await api.post(`/lab/samples/${rejecting.barcode}/reject`, { reason })
      setMsg(`${rejecting.barcode} rejected — booking flagged for recollection`)
      setRejecting(null)
      transit.reload()
    } catch (err) {
      setError(err)
      setRejecting(null)
    }
  }

  const desk = (walkins.data?.items || []).filter((b) => b.collection_type === 'lab_visit' && ['booked', 'recollection_required'].includes(b.status))

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div><h2>Sample accession</h2><p className="muted" style={{ margin: 0 }}>Receive tubes arriving at the lab, or reject unusable ones.</p></div>

      <form className="card row" onSubmit={(e) => { e.preventDefault(); if (barcode.trim()) receive(barcode) }}>
        <ScanBarcode size={22} color="var(--brand-600)" />
        <input className="input" style={{ maxWidth: 280 }} value={barcode} onChange={(e) => setBarcode(e.target.value.toUpperCase())} placeholder="Scan or type barcode (SMP…)" autoFocus />
        <button className="btn btn-primary">Receive</button>
      </form>
      {msg && <Alert kind="ok">{msg}</Alert>}
      <ErrorBox error={error} />

      <div>
        <h3>In transit ({(transit.data || []).length})</h3>
        {transit.loading ? <Spinner /> : (transit.data || []).length === 0 ? <p className="muted small">No samples on the way.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Barcode</th><th>Sample</th><th>Collected</th><th>Booking</th><th></th></tr></thead>
              <tbody>
                {transit.data.map((s) => (
                  <tr key={s.id}>
                    <td><span className="kbd">{s.barcode}</span></td>
                    <td>{SAMPLE_LABELS[s.sample_type]}</td>
                    <td>{fmtDateTime(s.collected_at)}</td>
                    <td><Link to={`/account/bookings/${s.booking_id}`} className="small">View</Link></td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <button className="btn btn-brand btn-sm" onClick={() => receive(s.barcode)}>Receive</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setRejecting(s)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3><Building2 size={18} /> Walk-in desk — today</h3>
        <p className="small muted">Customers who booked a centre visit. Draw their samples here.</p>
        {walkins.loading ? <Spinner /> : desk.length === 0 ? <Empty title="No walk-ins waiting" /> : (
          <div className="grid grid-2">{desk.map((b) => <CollectCard key={b.id} bookingId={b.id} onDone={() => { transit.reload() }} />)}</div>
        )}
      </div>

      {rejecting && (
        <Modal title={`Reject ${rejecting.barcode}`} onClose={() => setRejecting(null)}>
          <div className="stack">
            <Field label="Reason">
              <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Alert kind="warn">The booking will be marked for recollection and the customer will need a new sample.</Alert>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Back</button>
              <button className="btn btn-danger" onClick={reject}>Reject sample</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
