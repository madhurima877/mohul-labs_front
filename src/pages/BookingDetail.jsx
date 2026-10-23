import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Building2, CalendarDays, CheckCircle2, Clock, Download, FileText, Home as HomeIcon, Lock, Send, TestTube } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { useAuth } from '../context/AuthContext'
import { Alert, ErrorBox, Field, Modal, Spinner, StatusBadge } from '../components/ui'
import { DeliveryNote } from '../staff/FrontDesk'
import { BOOKING_STEPS, fmtDate, fmtDateTime, fmtTime, rupees, SAMPLE_LABELS, titleCase } from '../utils'

function Timeline({ booking }) {
  const reached = new Map(booking.history.map((h) => [h.to_status, h.created_at]))
  const steps = BOOKING_STEPS.filter((s) => booking.collection_type === 'home' || s.key !== 'phlebotomist_assigned')
  const currentIdx = steps.findIndex((s) => s.key === booking.status)
  return (
    <ul className="timeline">
      {steps.map((s, i) => {
        const done = reached.has(s.key) && (currentIdx === -1 || i <= currentIdx)
        return (
          <li key={s.key} className={i === currentIdx ? 'current done' : done ? 'done' : ''}>
            <span className="dot" />
            <strong>{s.label}</strong>
            {done && <small>{fmtDateTime(reached.get(s.key))}</small>}
          </li>
        )
      })}
    </ul>
  )
}

// ReportDelivery shows staff how this customer gets the report and lets them send it again, or to an
// email the customer gives at the counter.
function ReportDelivery({ booking, onSent }) {
  const ways = booking.report_delivery || []
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState(null)
  const send = async () => {
    setBusy(true)
    setError(null)
    setMsg('')
    try {
      await api.post(`/bookings/${booking.id}/send-report`, { email })
      setMsg('Report is being sent.')
      setTimeout(onSent, 2000)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="card stack">
      <h3 style={{ margin: 0 }}>Report delivery</h3>
      <div className="small"><DeliveryNote ways={ways} /></div>
      {booking.status === 'report_ready' && (
        <>
          <Field label={ways.includes('email') ? 'Send to a different email (optional)' : 'Add an email to send it (optional)'}>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <ErrorBox error={error} />
          {msg && <Alert kind="ok">{msg}</Alert>}
          <button className="btn btn-teal" disabled={busy || (ways.length === 0 && !email.trim())} onClick={send}>
            <Send size={15} /> {ways.length || email.trim() ? 'Send report' : 'No phone or email — hand over a printout'}
          </button>
        </>
      )}
    </div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'
  const booking = useFetch(`/bookings/${id}`)
  const reports = useFetch(`/bookings/${id}/reports`)
  const patients = useFetch(isCustomer ? '/patients' : null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [payOrder, setPayOrder] = useState(null)

  if (booking.loading) return <Spinner />
  if (booking.error) return <div className="container section"><ErrorBox error={booking.error} /></div>
  const b = booking.data

  const names = Object.fromEntries((patients.data || []).map((p) => [p.id, p.name]))
  ;(reports.data || []).forEach((r) => { names[r.patient_id] = r.patient_name })
  const byPatient = b.items.reduce((m, it) => ((m[it.patient_id] ||= []).push(it), m), {})
  const canCancel = isCustomer && ['booked', 'phlebotomist_assigned'].includes(b.status)
  const needsPayment = isCustomer && b.payment_mode === 'online' && b.payment_status === 'pending' && b.status !== 'cancelled'

  const act = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  const cancel = () => {
    const reason = window.prompt('Why are you cancelling? (optional)', 'Change of plans')
    if (reason === null) return
    act(async () => { await api.post(`/bookings/${b.id}/cancel`, { reason }); booking.reload() })
  }
  const startPay = () => act(async () => setPayOrder(await api.post(`/bookings/${b.id}/payments`)))
  const pay = () => act(async () => {
    await api.post(`/dev/payments/${payOrder.order_id}/simulate`)
    setPayOrder(null)
    booking.reload()
  })

  return (
    <div className="container section-sm">
      {location.state?.placed && <div style={{ marginBottom: 16 }}><Alert kind="ok">Booking confirmed! We've sent the details to your phone by SMS.</Alert></div>}
      <div className="crumbs">{isCustomer ? <Link to="/account/bookings">My bookings</Link> : <Link to="/staff">Staff</Link>} / {b.booking_no}</div>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Booking {b.booking_no}</h1>
          <div className="meta-list" style={{ margin: 0 }}>
            <span><CalendarDays size={14} /> {fmtDate(b.slot_date)}, {fmtTime(b.slot_start)}</span>
            <span>{b.collection_type === 'home' ? <><HomeIcon size={14} /> Home collection</> : <><Building2 size={14} /> Centre visit</>}</span>
          </div>
        </div>
        <StatusBadge status={b.status} />
      </div>
      <ErrorBox error={error} />
      {b.status === 'recollection_required' && (
        <Alert kind="warn">One of your samples could not be tested. We'll contact you to collect it again — sorry for the trouble.</Alert>
      )}
      {b.status === 'cancelled' && <Alert kind="info">This booking was cancelled{b.cancel_reason ? `: ${b.cancel_reason}` : ''}.{b.payment_status === 'refund_pending' ? ' Your refund is being processed.' : ''}</Alert>}

      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="stack" style={{ gap: 18 }}>
          {(reports.data || []).length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--ok)' }}>
              <h3><FileText size={18} /> Reports</h3>
              {reports.data.map((r) => (
                <div key={r.id} className="list-row">
                  <div>
                    <strong>{r.patient_name}</strong>
                    <div className="small muted">{r.status === 'ready' ? `Ready · ${fmtDateTime(r.generated_at)}` : 'Being prepared…'}</div>
                    {(r.delivered_sms_at || r.delivered_email_at) && (
                      <div className="small muted">
                        Sent{r.delivered_sms_at ? ` by SMS ${fmtDateTime(r.delivered_sms_at)}` : ''}{r.delivered_sms_at && r.delivered_email_at ? ',' : ''}
                        {r.delivered_email_at ? ` by email ${fmtDateTime(r.delivered_email_at)}` : ''}
                      </div>
                    )}
                  </div>
                  {r.status === 'ready'
                    ? <button className="btn btn-teal btn-sm" onClick={() => act(() => api.openReport(r.id))}><Download size={15} /> View report</button>
                    : <StatusBadge status={r.status} />}
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3>Tests booked</h3>
            {Object.entries(byPatient).map(([pid, items]) => (
              <div key={pid} style={{ marginTop: 12 }}>
                <div className="small" style={{ fontWeight: 700, color: 'var(--teal-700)' }}>{names[pid] || 'Patient'}</div>
                {items.map((it) => (
                  <div key={it.id} className="summary-line">
                    <span>{it.name} {it.item_type === 'package' && <span className="badge badge-blue">Package</span>}</span>
                    <span>{rupees(it.price_paise)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="divider" style={{ margin: '12px 0' }} />
            <div className="summary-line"><span>Subtotal</span><span>{rupees(b.subtotal_paise)}</span></div>
            <div className="summary-line"><span>Home collection</span><span>{b.home_collection_fee_paise ? rupees(b.home_collection_fee_paise) : 'Free'}</span></div>
            <div className="summary-total"><span>Total</span><span>{rupees(b.total_paise)}</span></div>
            <p className="small" style={{ marginTop: 8 }}>
              Payment: {b.payment_mode === 'online' ? 'Online' : 'At collection'} ·{' '}
              <span className={`badge ${b.payment_status === 'paid' ? 'badge-ok' : 'badge-warn'}`}>{titleCase(b.payment_status)}</span>
            </p>
          </div>

          {b.samples?.length > 0 && (
            <div className="card">
              <h3><TestTube size={18} /> Samples</h3>
              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="table">
                  <thead><tr><th>Barcode</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {b.samples.map((s) => (
                      <tr key={s.id}>
                        <td><span className="kbd">{s.barcode}</span></td>
                        <td>{names[s.patient_id] || '—'}</td>
                        <td>{SAMPLE_LABELS[s.sample_type]}</td>
                        <td>{titleCase(s.status)}{s.rejection_reason && <div className="small muted">{s.rejection_reason}</div>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {b.address && (
            <div className="card">
              <h3>Collection address</h3>
              <p style={{ margin: 0 }}>{[b.address.line1, b.address.line2, b.address.landmark].filter(Boolean).join(', ')}</p>
              <p className="muted" style={{ margin: 0 }}>{b.address.city}, {b.address.state} – {b.address.pincode}</p>
            </div>
          )}
        </div>

        <aside className="stack sticky" style={{ gap: 18 }}>
          {needsPayment && (
            <div className="card" style={{ borderTop: '4px solid var(--warn)' }}>
              <h3>Payment pending</h3>
              <p className="small muted">Pay before your slot so the phlebotomist can collect your sample.</p>
              <button className="btn btn-primary btn-block" disabled={busy} onClick={startPay}>Pay {rupees(b.total_paise)}</button>
            </div>
          )}
          <div className="card">
            <h3>Status</h3>
            <Timeline booking={b} />
            {b.status === 'report_ready' && <p className="row small" style={{ color: 'var(--ok)', fontWeight: 650 }}><CheckCircle2 size={16} /> All reports are ready.</p>}
            {b.report_expected_at && !['report_ready', 'cancelled'].includes(b.status) && (
              <p className="row small" style={{ gap: 6 }}><Clock size={15} /> Report expected by <strong>{fmtDateTime(b.report_expected_at)}</strong></p>
            )}
          </div>
          {!isCustomer && <ReportDelivery booking={b} onSent={() => reports.reload()} />}
          {canCancel && (
            <div className="stack" style={{ gap: 6 }}>
              <button className="btn btn-danger" disabled={busy} onClick={cancel}>Cancel booking</button>
              <p className="small muted" style={{ margin: 0 }}>Booked tests can't be changed. To add or remove tests, cancel this booking and book again.</p>
            </div>
          )}
        </aside>
      </div>

      {payOrder && (
        <Modal title="Complete payment" onClose={() => setPayOrder(null)}>
          <div className="stack">
            <Alert kind="info">Test payment gateway — no real money is charged in this environment.</Alert>
            <div className="summary-total"><span>Amount</span><span>{rupees(payOrder.amount_paise)}</span></div>
            <button className="btn btn-primary btn-block btn-lg" disabled={busy} onClick={pay}><Lock size={16} /> {busy ? 'Processing…' : `Pay ${rupees(payOrder.amount_paise)}`}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
