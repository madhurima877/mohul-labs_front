import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, FlaskConical, Mail, MessageSquare, Package, Plus, Search, Smile, Store, TestTube, Trash2, UserPlus, UserRound, X } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Alert, ErrorBox, Field, Spinner, StatusBadge } from '../components/ui'
import { age, DENTAL_CATEGORIES, fmtDateTime, fmtTime, rupees } from '../utils'
import { CollectCard } from './Collections'

const LAB_KEY = 'mohul_desk_lab'

// How the report reaches the customer, from the contact details given at the counter.
export function DeliveryNote({ ways }) {
  if (!ways || ways.length === 0) {
    return (
      <span className="row" style={{ gap: 6, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <Store size={15} style={{ flexShrink: 0, marginTop: 2 }} /> No phone or email — customer collects the report at the lab
      </span>
    )
  }
  return (
    <span className="row" style={{ gap: 10 }}>
      {ways.includes('sms') && <span className="row" style={{ gap: 4 }}><MessageSquare size={15} /> SMS with report link</span>}
      {ways.includes('email') && <span className="row" style={{ gap: 4 }}><Mail size={15} /> Email with report attached</span>}
    </span>
  )
}
const RELATIONS = ['self', 'spouse', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'other']

let nextKey = 1
const newPerson = (relation = 'self') => ({
  key: nextKey++, patientId: '', name: '', gender: 'female', ageYears: '', dob: '', relation, items: [],
})

function savedLab() {
  try { return localStorage.getItem(LAB_KEY) || '' } catch { return '' }
}

// ItemPicker searches tests and packages and keeps the chosen ones as removable chips.
function ItemPicker({ catalog, items, onChange }) {
  const [q, setQ] = useState('')
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return catalog.filter((c) => !items.some((i) => i.code === c.code)
      && (c.name.toLowerCase().includes(term) || c.code.toLowerCase().startsWith(term))).slice(0, 8)
  }, [q, catalog, items])

  const add = (c) => {
    onChange([...items, c])
    setQ('')
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} />
        <input className="input" style={{ paddingLeft: 36 }} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Add test or package — type CBC, thyroid, lipid…"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (matches[0]) add(matches[0]) } }} />
        {matches.length > 0 && (
          <div className="dropdown" style={{ left: 0, right: 0, top: 'calc(100% + 4px)' }}>
            {matches.map((c) => (
              <button key={c.code} type="button" onClick={() => add(c)}>
                {c.type === 'package' ? <Package size={15} /> : <TestTube size={15} />}
                <span style={{ flex: 1 }}>{c.name} <span className="small muted">{c.code}</span></span>
                <span className="small muted">{c.tat}h</span>
                <strong>{rupees(c.price)}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="row" style={{ gap: 6 }}>
          {items.map((i) => (
            <span key={i.code} className={`badge ${i.type === 'package' ? 'badge-accent' : ''}`} style={{ padding: '6px 10px', fontSize: '.8rem' }}>
              {i.name} · {rupees(i.price)} · {i.tat}h
              <button type="button" onClick={() => onChange(items.filter((x) => x.code !== i.code))} aria-label={`Remove ${i.name}`}
                style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ index, person, family, catalog, onChange, onRemove, withTests = true, title, defaultName }) {
  const set = (k) => (e) => onChange({ ...person, [k]: e.target.value })
  const existing = family.find((p) => p.id === person.patientId)
  const subtotal = person.items.reduce((s, i) => s + i.price, 0)
  return (
    <div className="card" style={{ borderLeft: '4px solid var(--brand-500)' }}>
      <div className="row-between">
        <h3 style={{ margin: 0 }}><UserRound size={18} /> {title || `Person ${index + 1}`}</h3>
        {onRemove && <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}><Trash2 size={15} /> Remove</button>}
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {family.length > 0 && (
          <Field label="Who is this?">
            <select className="input" value={person.patientId} onChange={set('patientId')}>
              <option value="">New person (enter details)</option>
              {family.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.relation}, {age(p.dob)} yrs</option>)}
            </select>
          </Field>
        )}
        {!existing && (
          <div className="form-grid">
            <Field label="Full name">
              <input className="input" value={person.name} onChange={set('name')} required={!defaultName}
                placeholder={defaultName ? `Same as customer (${defaultName})` : ''} />
            </Field>
            <Field label="Gender">
              <select className="input" value={person.gender} onChange={set('gender')}>
                <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Age (years)">
              <input className="input" type="number" min="1" max="120" value={person.ageYears} onChange={set('ageYears')} placeholder="or date of birth →" />
            </Field>
            <Field label="Date of birth (if known)">
              <input className="input" type="date" value={person.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Relation to account holder">
              <select className="input" value={person.relation} onChange={set('relation')}>
                {RELATIONS.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
            </Field>
          </div>
        )}
        {withTests && (
          <Field label="Tests">
            <ItemPicker catalog={catalog} items={person.items} onChange={(items) => onChange({ ...person, items })} />
          </Field>
        )}
        {withTests && subtotal > 0 && <div className="summary-line" style={{ padding: 0 }}><span>Subtotal for this person</span><strong>{rupees(subtotal)}</strong></div>}
      </div>
    </div>
  )
}

const NO_CONTACT = { found: false, patients: [], checked: false }

const newDentalVisit = () => ({ person: newPerson(), dentistId: '', serviceCode: 'D-CONSULT', startTime: '', notes: '', checkIn: true })

// DentalWalkIn picks the dentist, treatment and a time today for someone at the clinic counter.
function DentalWalkIn({ lab, family, value, onChange, customerName }) {
  const dentists = useFetch(lab ? `/dental/dentists?lab_id=${lab.id}` : null)
  const services = useFetch('/dental/services')
  const slots = useFetch(value.dentistId ? `/desk/dental/slots?dentist_id=${value.dentistId}` : null)
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => {
    const list = dentists.data || []
    if (list.length && !list.some((d) => d.id === value.dentistId)) onChange({ ...value, dentistId: list[0].id, startTime: '' })
  }, [dentists.data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (lab && !lab.has_dental) return <Alert kind="warn">{lab.name} has no dental clinic. Choose a centre with a dental chair above.</Alert>
  if (dentists.loading || services.loading) return <Spinner />

  const free = (slots.data || []).filter((sl) => sl.available)
  const service = services.data?.find((sv) => sv.code === value.serviceCode)
  return (
    <>
      <PersonCard index={0} title="Patient" person={value.person} family={family} catalog={[]} withTests={false} defaultName={customerName}
        onChange={(person) => onChange({ ...value, person })} />
      <div className="card stack">
        <h3 style={{ margin: 0 }}>Visit</h3>
        <div className="form-grid">
          <Field label="Dentist">
            <select className="input" value={value.dentistId} onChange={(e) => onChange({ ...value, dentistId: e.target.value, startTime: '' })}>
              {(dentists.data || []).map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
            </select>
          </Field>
          <Field label="Treatment">
            <select className="input" value={value.serviceCode} onChange={set('serviceCode')}>
              {Object.entries(DENTAL_CATEGORIES).map(([cat, label]) => (
                <optgroup key={cat} label={label}>
                  {(services.data || []).filter((sv) => sv.category === cat).map((sv) => (
                    <option key={sv.code} value={sv.code}>{sv.name} — {rupees(sv.price_paise)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Time today">
          {slots.loading ? <Spinner /> : slots.error ? <ErrorBox error={slots.error} /> : (slots.data || []).length === 0 ? (
            <Alert kind="warn">This dentist isn't seeing patients for the rest of today. Pick another dentist.</Alert>
          ) : free.length === 0 ? (
            <Alert kind="warn">Fully booked for today. Pick another dentist.</Alert>
          ) : (
            <div className="slot-grid">
              <button type="button" className={`slot ${value.startTime === '' ? 'selected' : ''}`} onClick={() => onChange({ ...value, startTime: '' })}>
                Next free<small>{fmtTime(free[0].start_time)}</small>
              </button>
              {slots.data.map((sl) => (
                <button key={sl.start_time} type="button" disabled={!sl.available}
                  className={`slot ${value.startTime === sl.start_time ? 'selected' : ''}`}
                  onClick={() => onChange({ ...value, startTime: sl.start_time })}>
                  {fmtTime(sl.start_time)}
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Problem / complaint (optional)">
          <textarea className="input" value={value.notes} onChange={set('notes')} maxLength={500} placeholder="e.g. Swelling near upper right tooth since yesterday" />
        </Field>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={value.checkIn} onChange={set('checkIn')} style={{ accentColor: 'var(--brand-600)', width: 18, height: 18 }} />
          Patient is here — check them in now
        </label>
        {service && <div className="summary-total" style={{ marginTop: 0 }}><span>Fee (pay at clinic after the visit)</span><span>{rupees(service.price_paise)}</span></div>}
      </div>
    </>
  )
}

// The first person defaults to the customer's own name, so staff don't type it twice.
const personPayload = (p, fallbackName = '') => ({
  patient_id: p.patientId || undefined,
  name: p.name.trim() || fallbackName,
  gender: p.gender,
  dob: p.dob || undefined,
  age_years: p.dob ? undefined : Number(p.ageYears) || undefined,
  relation: p.relation,
})

export default function FrontDesk() {
  const labs = useFetch('/labs')
  const tests = useFetch('/tests?limit=100')
  const packages = useFetch('/packages')

  const [labId, setLabId] = useState(savedLab)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  // Default is a walk-in with no phone: staff just type the name. Phone/email are added only if the
  // customer wants the report sent directly. lookup.found = a returning customer was found by phone.
  const [lookup, setLookup] = useState(NO_CONTACT)
  const [showContact, setShowContact] = useState(false)
  const [name, setName] = useState('')
  const [people, setPeople] = useState([newPerson()])
  const [paid, setPaid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)
  const [mode, setMode] = useState('lab')
  const [dental, setDental] = useState(newDentalVisit)
  const [appt, setAppt] = useState(null)

  useEffect(() => {
    if (!labId && labs.data?.length) setLabId(labs.data[0].id)
  }, [labs.data, labId])
  useEffect(() => {
    try { if (labId) localStorage.setItem(LAB_KEY, labId) } catch { /* ignore */ }
  }, [labId])

  const catalog = useMemo(() => [
    ...(packages.data || []).map((p) => ({ type: 'package', code: p.code, name: p.name, price: p.price_paise,
      tat: Math.max(24, ...(p.tests || []).map((t) => t.tat_hours)) })),
    ...(tests.data?.items || []).map((t) => ({ type: 'test', code: t.code, name: t.name, price: t.price_paise, tat: t.tat_hours })),
  ], [tests.data, packages.data])

  const family = lookup?.patients || []
  const total = people.reduce((s, p) => s + p.items.reduce((a, i) => a + i.price, 0), 0)
  // Longest turnaround among everything ordered; the report is expected that long after collection.
  const maxTat = Math.max(0, ...people.flatMap((p) => p.items.map((i) => i.tat)))
  const ways = [phone.length === 10 && 'sms', email.trim() && 'email'].filter(Boolean)

  const find = async (e) => {
    e?.preventDefault()
    setError(null)
    try {
      const res = await api.get(`/desk/customers?phone=${encodeURIComponent(phone)}`)
      setLookup({ found: true, user: res.user, patients: res.patients })
      setName(res.user.name)
      setEmail(res.user.email || '')
      // Default the first person to the account holder's own record if there is one.
      const self = res.patients.find((p) => p.relation === 'self') || res.patients[0]
      setPeople([{ ...newPerson(), patientId: self ? self.id : '' }])
      setDental((d) => ({ ...d, person: { ...newPerson(), patientId: self ? self.id : '' } }))
    } catch (err) {
      if (err.status === 404) {
        // New number: keep what was typed; an account is created for it on registration.
        setLookup({ found: false, patients: [], checked: true })
      } else {
        setError(err)
      }
    }
  }

  // clearContact goes back to the default "no phone" walk-in.
  const clearContact = () => {
    const wasFound = lookup.found
    setPhone('')
    setEmail('')
    setShowContact(false)
    setLookup(NO_CONTACT)
    if (wasFound) {
      setName('')
      setPeople([newPerson()])
      setDental((d) => ({ ...d, person: newPerson() }))
    }
  }

  const changePhone = (value) => {
    setPhone(value)
    if (lookup.found) {
      // Editing the number of a customer we had found means it is someone else.
      setName('')
      setEmail('')
      setPeople([newPerson()])
      setDental((d) => ({ ...d, person: newPerson() }))
    }
    if (lookup.found || lookup.checked) setLookup(NO_CONTACT)
  }

  const phoneIncomplete = phone.length > 0 && phone.length !== 10

  const reset = () => {
    setPhone('')
    setEmail('')
    setShowContact(false)
    setLookup(NO_CONTACT)
    setName('')
    setPeople([newPerson()])
    setPaid(true)
    setBooking(null)
    setDental(newDentalVisit())
    setAppt(null)
    setError(null)
  }

  const registerDental = async () => {
    setBusy(true)
    setError(null)
    try {
      setAppt(await api.post('/desk/dental/walkins', {
        phone,
        email,
        name: name || dental.person.name,
        patient: personPayload(dental.person, name),
        dentist_id: dental.dentistId,
        service_code: dental.serviceCode,
        start_time: dental.startTime || undefined,
        notes: dental.notes,
        check_in: dental.checkIn,
      }))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const register = async (e) => {
    e.preventDefault()
    if (mode === 'dental') return registerDental()
    setBusy(true)
    setError(null)
    try {
      const body = {
        phone,
        email,
        name: name || people[0]?.name,
        lab_id: labId,
        paid,
        patients: people.map((p, i) => ({
          ...personPayload(p, i === 0 ? name : ''),
          tests: p.items.filter((i) => i.type === 'test').map((i) => i.code),
          packages: p.items.filter((i) => i.type === 'package').map((i) => i.code),
        })),
      }
      setBooking(await api.post('/desk/walkins', body))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (labs.loading || tests.loading || packages.loading) return <Spinner />

  if (appt) {
    return (
      <div className="stack" style={{ gap: 18, maxWidth: 760 }}>
        <div className="card" style={{ borderTop: '4px solid var(--ok)' }}>
          <div className="row-between">
            <h2 style={{ margin: 0 }}><CheckCircle2 size={22} color="var(--ok)" /> Dental visit registered</h2>
            <span className="kbd" style={{ fontSize: '1rem' }}>{appt.appointment_no}</span>
          </div>
          <div className="summary-line" style={{ marginTop: 10 }}><span>Patient</span><strong>{appt.patient_name}{phone ? ` · +91 ${phone}` : ''}</strong></div>
          <div className="summary-line"><span>Dentist</span><strong>{appt.dentist_name}</strong></div>
          <div className="summary-line"><span>Treatment</span><strong>{appt.service_name}</strong></div>
          <div className="summary-line"><span>Time</span><strong>Today, {fmtTime(appt.start_time)}</strong></div>
          <div className="summary-line"><span>Status</span><StatusBadge status={appt.status} /></div>
          <div className="summary-total"><span>Collect after the visit</span><span>{rupees(appt.price_paise)}</span></div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {appt.status === 'checked_in' ? 'The patient is checked in and in the dentist\'s queue.' : 'Ask the patient to wait; check them in from the dental desk when they are called.'}
            {phone ? " They can see this visit and the dentist's notes by logging in with this phone number." : ''}
          </p>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'start' }} onClick={reset}><UserPlus size={15} /> Register next person</button>
        </div>
      </div>
    )
  }

  if (booking) {
    return (
      <div className="stack" style={{ gap: 18, maxWidth: 760 }}>
        <div className="card" style={{ borderTop: '4px solid var(--ok)' }}>
          <div className="row-between">
            <h2 style={{ margin: 0 }}><CheckCircle2 size={22} color="var(--ok)" /> Registered</h2>
            <span className="kbd" style={{ fontSize: '1rem' }}>{booking.booking_no}</span>
          </div>
          <div className="summary-line" style={{ marginTop: 10 }}><span>Customer</span><strong>{name}{phone ? ` · +91 ${phone}` : ' · no phone'}</strong></div>
          <div className="summary-line"><span>Total</span><strong>{rupees(booking.total_paise)}</strong></div>
          <div className="summary-line"><span>Payment</span>
            <span className={`badge ${booking.payment_status === 'paid' ? 'badge-ok' : 'badge-warn'}`}>{booking.payment_status === 'paid' ? 'Paid at counter' : 'Collect before drawing sample'}</span>
          </div>
          {booking.report_expected_at && (
            <div className="summary-line"><span>Report expected</span><strong>{fmtDateTime(booking.report_expected_at)}</strong></div>
          )}
          <div className="summary-line"><span>Report delivery</span><span className="small"><DeliveryNote ways={booking.report_delivery} /></span></div>
          <p className="small muted" style={{ marginTop: 8 }}>Tell the customer when to expect the report and how they will get it.</p>
          <div className="row">
            <Link to={`/account/bookings/${booking.id}`} className="btn btn-outline btn-sm">Open booking</Link>
            <button className="btn btn-primary btn-sm" onClick={reset}><UserPlus size={15} /> Register next person</button>
          </div>
        </div>
        <div>
          <h3>Draw samples now</h3>
          <CollectCard bookingId={booking.id} />
        </div>
      </div>
    )
  }

  return (
    <form className="stack" style={{ gap: 18, maxWidth: 860 }} onSubmit={register}>
      <div className="row-between">
        <div><h2>Front desk — walk-in</h2><p className="muted" style={{ margin: 0 }}>Register someone who came to the centre without booking online.</p></div>
        <Field label="Centre">
          <select className="input" style={{ minWidth: 240 }} value={labId} onChange={(e) => setLabId(e.target.value)}>
            {(labs.data || []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="tabs" style={{ marginBottom: 0 }}>
        <button type="button" className={`tab ${mode === 'lab' ? 'active' : ''}`} onClick={() => { setMode('lab'); setError(null) }}><FlaskConical size={16} /> Lab tests</button>
        <button type="button" className={`tab ${mode === 'dental' ? 'active' : ''}`} onClick={() => { setMode('dental'); setError(null) }}><Smile size={16} /> Dental</button>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>1. Customer</h3>
        {lookup.found ? (
          <Alert kind="ok">
            Returning customer: <strong>{lookup.user.name || 'no name saved'}</strong> · {family.length} family member(s) on file.{' '}
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearContact}>Not them? Start over</button>
          </Alert>
        ) : (
          <Field label="Customer's name">
            <input className="input" style={{ maxWidth: 360 }} value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </Field>
        )}

        {!showContact ? (
          <button type="button" className="btn btn-outline btn-sm" style={{ alignSelf: 'start' }} onClick={() => setShowContact(true)}>
            <Plus size={15} /> Add phone or email to get the report directly
          </button>
        ) : (
          <div className="stack" style={{ padding: 14, background: 'var(--brand-50)', borderRadius: 'var(--radius-sm)', gap: 10 }}>
            <div className="row-between">
              <strong className="small">Send the report directly (optional)</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearContact}><X size={15} /> Remove</button>
            </div>
            <Field label="Mobile number — report link by SMS">
              <div className="row" style={{ gap: 8 }}>
                <span className="input" style={{ width: 64, textAlign: 'center', background: '#fff' }}>+91</span>
                <input className="input" style={{ maxWidth: 200 }} value={phone} inputMode="numeric" placeholder="10-digit mobile" autoFocus
                  onChange={(e) => changePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (phone.length === 10) find(e) } }} />
                <button type="button" className="btn btn-brand btn-sm" disabled={phone.length !== 10 || lookup.found} onClick={find}>
                  <Search size={15} /> Find returning customer
                </button>
              </div>
            </Field>
            {phoneIncomplete && <span className="small" style={{ color: 'var(--warn)' }}>Enter all 10 digits, or clear the number.</span>}
            {lookup.checked && !lookup.found && (
              <span className="small muted">New number — an account is created for it, so they can also log in later to see reports.</span>
            )}
            <Field label="Email — report attached">
              <input className="input" style={{ maxWidth: 360 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </Field>
          </div>
        )}
        {mode === 'lab' && <div className="small muted"><DeliveryNote ways={ways} /></div>}
      </div>

      {mode === 'dental' && (
        <>
          <h3 style={{ margin: 0 }}>2. Dental visit</h3>
          <DentalWalkIn lab={(labs.data || []).find((l) => l.id === labId)} family={family} value={dental} onChange={setDental} customerName={lookup.found ? '' : name.trim()} />
          <ErrorBox error={error} />
          <button className="btn btn-primary btn-lg" style={{ alignSelf: 'start' }}
            disabled={busy || phoneIncomplete || !dental.dentistId || !(labs.data || []).find((l) => l.id === labId)?.has_dental}>
            {busy ? 'Registering…' : dental.checkIn ? 'Register & check in' : 'Register dental visit'}
          </button>
        </>
      )}

      {mode === 'lab' && (
        <>
          <h3 style={{ margin: 0 }}>2. People being tested</h3>
          {people.map((p, i) => (
            <PersonCard key={p.key} index={i} person={p} family={family} catalog={catalog} defaultName={i === 0 && !lookup.found ? name.trim() : ''}
              onChange={(np) => setPeople(people.map((x) => (x.key === p.key ? np : x)))}
              onRemove={people.length > 1 ? () => setPeople(people.filter((x) => x.key !== p.key)) : null} />
          ))}
          {people.length < 6 && (
            <button type="button" className="btn btn-outline" style={{ alignSelf: 'start' }} onClick={() => setPeople([...people, newPerson('other')])}>
              <Plus size={16} /> Add another person
            </button>
          )}

          <div className="card">
            <h3>3. Payment</h3>
            <div className="summary-total" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}><span>Total to collect</span><span>{rupees(total)}</span></div>
            {maxTat > 0 && (
              <div className="summary-line"><span className="row" style={{ gap: 6 }}><Clock size={15} /> Report expected by</span>
                <strong>{fmtDateTime(Date.now() + maxTat * 3600 * 1000)}</strong></div>
            )}
            <label className="row" style={{ marginTop: 10, gap: 8 }}>
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} style={{ accentColor: 'var(--brand-600)', width: 18, height: 18 }} />
              Payment received at the counter (cash / UPI / card)
            </label>
            <ErrorBox error={error} />
            <button className="btn btn-primary btn-lg" style={{ marginTop: 14 }}
              disabled={busy || phoneIncomplete || !labId || total === 0 || people.some((p) => p.items.length === 0)}>
              {busy ? 'Registering…' : 'Register walk-in'}
            </button>
            {people.some((p) => p.items.length === 0) && <p className="small muted" style={{ marginTop: 6 }}>Add at least one test for each person.</p>}
          </div>
        </>
      )}
    </form>
  )
}
