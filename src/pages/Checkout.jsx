import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Building2, CreditCard, Home as HomeIcon, Lock, MapPin, Plus, Wallet } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { useCart } from '../context/CartContext'
import { AddressForm, PatientForm } from '../components/Forms'
import { Alert, ErrorBox, Modal, Spinner } from '../components/ui'
import { age, fmtDate, fmtTime, isoDate, nextDays, rupees } from '../utils'
import { cartConflicts } from './Cart'

const HOME_FEE = 20000
const FREE_HOME_MIN = 100000

export default function Checkout() {
  const navigate = useNavigate()
  const { items, total, clear } = useCart()
  const patients = useFetch('/patients')
  const addresses = useFetch('/addresses')
  const labs = useFetch('/labs')

  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState('home')
  const [addressId, setAddressId] = useState('')
  const [labId, setLabId] = useState('')
  const [date, setDate] = useState(isoDate(nextDays(2)[1]))
  const [slotId, setSlotId] = useState('')
  const [payment, setPayment] = useState('online')
  const [modal, setModal] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null) // { booking, order } while the payment window is open

  const address = addresses.data?.find((a) => a.id === addressId)
  const service = useFetch(mode === 'home' && address ? `/pincodes/${address.pincode}/serviceability` : null)
  const homeLabId = service.data?.serviceable && service.data.home_collection ? service.data.lab.id : ''
  const effectiveLab = mode === 'home' ? homeLabId : labId
  const slots = useFetch(effectiveLab ? `/slots?lab_id=${effectiveLab}&date=${date}` : null)

  useEffect(() => {
    if (patients.data?.length && selected.length === 0) setSelected([patients.data[0].id])
  }, [patients.data]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!addressId && addresses.data?.length) setAddressId(addresses.data[0].id)
  }, [addresses.data, addressId])
  useEffect(() => { setSlotId('') }, [effectiveLab, date])

  const subtotal = total * Math.max(selected.length, 1)
  const fee = mode === 'home' && subtotal < FREE_HOME_MIN ? HOME_FEE : 0
  const fasting = useMemo(() => items.some((i) => /LIPID|FBS|SWASTHFIT|DIABETES/.test(i.code)), [items])

  if (items.length === 0 && !order) return <Navigate to="/cart" replace />
  if (patients.loading || addresses.loading || labs.loading) return <Spinner />

  const togglePatient = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const ready = selected.length > 0 && slotId && (mode === 'lab_visit' || homeLabId) && cartConflicts(items).length === 0

  const place = async () => {
    setBusy(true)
    setError(null)
    const tests = items.filter((i) => i.type === 'test').map((i) => i.code)
    const packages = items.filter((i) => i.type === 'package').map((i) => i.code)
    try {
      const booking = await api.post('/bookings', {
        collection_type: mode,
        address_id: mode === 'home' ? addressId : undefined,
        slot_id: slotId,
        payment_mode: payment,
        patients: selected.map((patient_id) => ({ patient_id, tests, packages })),
      })
      if (payment === 'online') {
        let payOrder = null
        try {
          payOrder = await api.post(`/bookings/${booking.id}/payments`)
        } catch { /* booking exists; the customer can pay from the booking page */ }
        if (payOrder) setOrder({ booking, order: payOrder })
        else navigate(`/account/bookings/${booking.id}`, { state: { placed: true } })
      } else {
        navigate(`/account/bookings/${booking.id}`, { state: { placed: true } })
      }
      clear()
    } catch (err) {
      setError(err)
      if (err.code === 'SLOT_UNAVAILABLE') slots.reload()
    } finally {
      setBusy(false)
    }
  }

  const pay = async () => {
    setBusy(true)
    try {
      await api.post(`/dev/payments/${order.order.order_id}/simulate`)
      navigate(`/account/bookings/${order.booking.id}`, { state: { placed: true } })
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="container section-sm">
      <h1>Book sample collection</h1>
      {order ? (
        <Alert kind="ok">Booking {order.order.booking_no} placed. Complete the payment to confirm your slot.</Alert>
      ) : (
      <div className="two-col" style={{ marginTop: 18 }}>
        <div className="stack" style={{ gap: 18 }}>
          <ErrorBox error={error} />

          <div className="card">
            <div className="row-between"><h3>1. Who is getting tested?</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setModal('patient')}><Plus size={15} /> Add member</button></div>
            <p className="small muted">Every item in your cart is booked for each person you select.</p>
            {(patients.data || []).length === 0 && <Alert kind="info">Add yourself or a family member to continue.</Alert>}
            <div className="grid grid-2" style={{ gap: 10 }}>
              {(patients.data || []).map((p) => (
                <button key={p.id} className={`option-card ${selected.includes(p.id) ? 'selected' : ''}`} onClick={() => togglePatient(p.id)}>
                  <input type="checkbox" readOnly checked={selected.includes(p.id)} style={{ marginTop: 4, accentColor: 'var(--teal-600)' }} />
                  <div><strong>{p.name}</strong><small>{p.relation} · {p.gender} · {age(p.dob)} yrs</small></div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>2. Where should we collect the sample?</h3>
            <div className="grid grid-2" style={{ gap: 10, marginTop: 10 }}>
              <button className={`option-card ${mode === 'home' ? 'selected' : ''}`} onClick={() => setMode('home')}>
                <HomeIcon size={22} color="var(--teal-600)" />
                <div><strong>Home collection</strong><small>{subtotal >= FREE_HOME_MIN ? 'Free for this order' : `${rupees(HOME_FEE)}, free on ${rupees(FREE_HOME_MIN)}+`}</small></div>
              </button>
              <button className={`option-card ${mode === 'lab_visit' ? 'selected' : ''}`} onClick={() => setMode('lab_visit')}>
                <Building2 size={22} color="var(--blue-600)" />
                <div><strong>Visit a centre</strong><small>Walk in at your slot, no extra charge</small></div>
              </button>
            </div>

            {mode === 'home' ? (
              <div className="stack" style={{ marginTop: 16 }}>
                <div className="row-between"><strong>Collection address</strong>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal('address')}><Plus size={15} /> New address</button></div>
                {(addresses.data || []).length === 0 && <Alert kind="info">Add the address where our phlebotomist should come.</Alert>}
                {(addresses.data || []).map((a) => (
                  <button key={a.id} className={`option-card ${addressId === a.id ? 'selected' : ''}`} onClick={() => setAddressId(a.id)}>
                    <MapPin size={18} color="var(--teal-600)" />
                    <div><strong>{a.line1}</strong><small>{[a.line2, a.landmark, a.city, a.pincode].filter(Boolean).join(', ')}</small></div>
                  </button>
                ))}
                {address && service.data && !homeLabId && (
                  <Alert kind="warn">Sorry, home collection isn't available at pincode {address.pincode} yet. Choose “Visit a centre” instead.</Alert>
                )}
                {homeLabId && <p className="small muted">Your sample will be processed at {service.data.lab.name}.</p>}
              </div>
            ) : (
              <div className="stack" style={{ marginTop: 16 }}>
                <strong>Choose a centre</strong>
                {(labs.data || []).map((l) => (
                  <button key={l.id} className={`option-card ${labId === l.id ? 'selected' : ''}`} onClick={() => setLabId(l.id)}>
                    <Building2 size={18} color="var(--blue-600)" />
                    <div><strong>{l.name}</strong><small>{l.address}, {l.city} {l.pincode}</small></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>3. Pick a slot</h3>
            {fasting && <Alert kind="info">Some tests need 10–12 hours of fasting. An early-morning slot is best.</Alert>}
            <div className="date-strip" style={{ margin: '12px 0' }}>
              {nextDays(7).map((d) => {
                const v = isoDate(d)
                return (
                  <button key={v} className={`date-pill ${date === v ? 'selected' : ''}`} onClick={() => setDate(v)}>
                    <small>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                    <strong>{d.getDate()}</strong>
                    <small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small>
                  </button>
                )
              })}
            </div>
            {!effectiveLab ? <p className="muted small">Choose {mode === 'home' ? 'a serviceable address' : 'a centre'} to see slots.</p>
              : slots.loading ? <Spinner />
              : (slots.data || []).length === 0 ? <Alert kind="warn">No slots left on {fmtDate(date)}. Try another day.</Alert>
              : (
                <div className="slot-grid">
                  {slots.data.map((s) => (
                    <button key={s.id} className={`slot ${slotId === s.id ? 'selected' : ''}`} disabled={s.available <= 0} onClick={() => setSlotId(s.id)}>
                      {fmtTime(s.start_time)}<small>{s.available > 0 ? `${s.available} left` : 'Full'}</small>
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="card">
            <h3>4. Payment</h3>
            <div className="grid grid-2" style={{ gap: 10, marginTop: 10 }}>
              <button className={`option-card ${payment === 'online' ? 'selected' : ''}`} onClick={() => setPayment('online')}>
                <CreditCard size={22} color="var(--teal-600)" /><div><strong>Pay online now</strong><small>UPI, cards, net banking</small></div>
              </button>
              <button className={`option-card ${payment === 'cash' ? 'selected' : ''}`} onClick={() => setPayment('cash')}>
                <Wallet size={22} color="var(--blue-600)" /><div><strong>Pay at collection</strong><small>Cash or UPI to the phlebotomist</small></div>
              </button>
            </div>
          </div>
        </div>

        <aside className="card sticky">
          <h3>Booking summary</h3>
          {items.map((i) => <div key={i.code} className="summary-line small"><span>{i.name}</span><span>{rupees(i.price)}</span></div>)}
          <div className="divider" style={{ margin: '10px 0' }} />
          <div className="summary-line"><span>Subtotal × {selected.length || 1} person{selected.length > 1 ? 's' : ''}</span><span>{rupees(subtotal)}</span></div>
          <div className="summary-line"><span>Home collection</span><span>{mode === 'home' ? (fee ? rupees(fee) : 'Free') : '—'}</span></div>
          <div className="summary-total"><span>Total</span><span>{rupees(subtotal + fee)}</span></div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={!ready || busy} onClick={place}>
            {busy ? 'Placing booking…' : payment === 'online' ? 'Book & pay' : 'Confirm booking'}
          </button>
          {!ready && <p className="small muted" style={{ marginTop: 8 }}>Select a person, {mode === 'home' ? 'an address' : 'a centre'} and a slot.</p>}
        </aside>
      </div>
      )}

      {modal === 'patient' && (
        <Modal title="Add family member" onClose={() => setModal('')}>
          <PatientForm onCancel={() => setModal('')} onSaved={(p) => { setModal(''); setSelected((s) => [...s, p.id]); patients.reload() }} />
        </Modal>
      )}
      {modal === 'address' && (
        <Modal title="New address" onClose={() => setModal('')}>
          <AddressForm onCancel={() => setModal('')} onSaved={(a) => { setModal(''); setAddressId(a.id); addresses.reload() }} />
        </Modal>
      )}
      {order && (
        <Modal title="Complete payment" onClose={() => navigate(`/account/bookings/${order.booking.id}`)}>
          <div className="stack">
            <Alert kind="info">Test payment gateway — no real money is charged in this environment.</Alert>
            <div className="summary-line"><span>Booking</span><strong>{order.order.booking_no}</strong></div>
            <div className="summary-line"><span>Order</span><span className="small">{order.order.order_id}</span></div>
            <div className="summary-total"><span>Amount</span><span>{rupees(order.order.amount_paise)}</span></div>
            <button className="btn btn-primary btn-block btn-lg" disabled={busy} onClick={pay}><Lock size={16} /> {busy ? 'Processing…' : `Pay ${rupees(order.order.amount_paise)}`}</button>
            <p className="small muted center">You can also pay later from <Link to={`/account/bookings/${order.booking.id}`}>the booking page</Link>.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
