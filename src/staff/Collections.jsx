import { useState } from 'react'
import { Clock, MapPin, Phone, TestTube, Truck } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Alert, Empty, ErrorBox, Spinner, StatusBadge } from '../components/ui'
import { fmtDate, fmtTime, isoDate, rupees, SAMPLE_LABELS } from '../utils'

// CollectCard shows one booking to collect and records the collection. It is shared by the
// phlebotomist's home visits and the lab's walk-in desk.
export function CollectCard({ bookingId, onDone }) {
  const detail = useFetch(`/bookings/${bookingId}`)
  const [cash, setCash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [samples, setSamples] = useState(null)

  if (detail.loading) return <div className="card"><Spinner /></div>
  if (detail.error) return <ErrorBox error={detail.error} />
  const b = detail.data
  const patients = new Set(b.items.map((i) => i.patient_id)).size
  const collectable = ['phlebotomist_assigned', 'booked', 'recollection_required'].includes(b.status)
  const cashDue = b.payment_mode === 'cash' && b.payment_status === 'pending'
  const onlineDue = b.payment_mode === 'online' && b.payment_status === 'pending'

  const collect = async () => {
    setBusy(true)
    setError(null)
    try {
      setSamples(await api.post(`/staff/bookings/${b.id}/collect`, { cash_collected: cash }))
      detail.reload()
      onDone?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="row-between">
        <div className="row">
          <strong style={{ fontSize: '1.05rem' }}>{fmtTime(b.slot_start)}</strong>
          <span className="kbd">{b.booking_no}</span>
        </div>
        <StatusBadge status={b.status} />
      </div>
      {b.address && (
        <p className="row small" style={{ marginTop: 10, alignItems: 'start', flexWrap: 'nowrap' }}>
          <MapPin size={16} color="var(--brand-600)" style={{ flexShrink: 0, marginTop: 2 }} />
          {[b.address.line1, b.address.line2, b.address.landmark, b.address.city, b.address.pincode].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="meta-list">
        <span><TestTube size={14} /> {b.items.length} item(s) for {patients} person(s)</span>
        <span>{b.items.map((i) => i.code).filter((c, i, a) => a.indexOf(c) === i).join(', ')}</span>
      </div>
      <ErrorBox error={error} />
      {samples ? (
        <Alert kind="ok">
          Collected {samples.length} sample(s). Label the tubes:
          <div className="row" style={{ marginTop: 6 }}>
            {samples.map((s) => <span key={s.id} className="kbd">{s.barcode} · {SAMPLE_LABELS[s.sample_type]}</span>)}
          </div>
        </Alert>
      ) : collectable && (
        <div className="row-between" style={{ marginTop: 6 }}>
          {cashDue ? (
            <label className="row small" style={{ gap: 6 }}>
              <input type="checkbox" checked={cash} onChange={(e) => setCash(e.target.checked)} style={{ accentColor: 'var(--brand-600)' }} />
              Collected {rupees(b.total_paise)} from customer
            </label>
          ) : onlineDue ? <span className="small" style={{ color: 'var(--warn)' }}>Online payment not completed yet</span>
            : <span className="badge badge-ok">Paid</span>}
          <button className="btn btn-primary btn-sm" disabled={busy || (cashDue && !cash) || onlineDue} onClick={collect}>
            {busy ? 'Saving…' : 'Mark samples collected'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Collections() {
  const [date, setDate] = useState(isoDate(new Date()))
  const list = useFetch(`/staff/assignments?date=${date}`)
  return (
    <div className="stack">
      <div className="row-between">
        <div><h2>My collections</h2><p className="muted" style={{ margin: 0 }}>Home visits assigned to you for {fmtDate(date)}.</p></div>
        <input className="input" type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Alert kind="info"><span className="row" style={{ gap: 14 }}><span className="row" style={{ gap: 4 }}><Clock size={14} /> Reach 5 minutes early</span><span className="row" style={{ gap: 4 }}><Phone size={14} /> Call the customer if the address is unclear</span></span></Alert>
      <ErrorBox error={list.error} />
      {list.loading ? <Spinner /> : (list.data || []).length === 0 ? <Empty icon={Truck} title="No collections assigned for this day" /> : (
        <div className="grid grid-2">{list.data.map((b) => <CollectCard key={b.id} bookingId={b.id} />)}</div>
      )}
    </div>
  )
}
