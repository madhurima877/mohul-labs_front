import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, MapPin, Plus } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { PatientForm } from '../components/Forms'
import { Alert, ErrorBox, Field, Modal, Spinner } from '../components/ui'
import { age, DENTAL_CATEGORIES, fmtDate, fmtTime, isoDate, nextDays, rupees, WEEKDAYS } from '../utils'

const STEPS = ['Treatment', 'Dentist', 'Date & time', 'Confirm']

export default function DentalBook() {
  const [params] = useSearchParams()
  const services = useFetch('/dental/services')
  const dentists = useFetch('/dental/dentists')
  const patients = useFetch('/patients')

  const [step, setStep] = useState(0)
  const [serviceCode, setServiceCode] = useState(params.get('service') || '')
  const [dentistId, setDentistId] = useState(params.get('dentist') || '')
  const [city, setCity] = useState('')
  const [date, setDate] = useState(isoDate(new Date()))
  const [time, setTime] = useState('')
  const [patientId, setPatientId] = useState('')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const service = services.data?.find((s) => s.code === serviceCode)
  const dentist = dentists.data?.find((d) => d.id === dentistId)
  const slots = useFetch(dentistId && step === 2 ? `/dental/dentists/${dentistId}/availability?date=${date}` : null)

  useEffect(() => { setTime('') }, [date, dentistId])
  useEffect(() => {
    if (!patientId && patients.data?.length) setPatientId(patients.data[0].id)
  }, [patients.data, patientId])

  const cities = [...new Set((dentists.data || []).map((d) => d.city))]
  const canNext = [Boolean(service), Boolean(dentist), Boolean(time), Boolean(patientId)][step]

  const book = async () => {
    setBusy(true)
    setError(null)
    try {
      setDone(await api.post('/dental/appointments', {
        dentist_id: dentistId, service_code: serviceCode, patient_id: patientId, date, start_time: time, notes,
      }))
    } catch (err) {
      setError(err)
      if (err.code === 'SLOT_UNAVAILABLE') {
        setStep(2)
        slots.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="container section" style={{ maxWidth: 620 }}>
        <div className="card center" style={{ padding: 36 }}>
          <CheckCircle2 size={56} color="var(--ok)" />
          <h2 style={{ marginTop: 10 }}>Appointment confirmed</h2>
          <p className="muted">Booking ID <span className="kbd">{done.appointment_no}</span></p>
          <div className="stack" style={{ textAlign: 'left', margin: '18px 0', gap: 4 }}>
            <div className="summary-line"><span>Treatment</span><strong>{done.service_name}</strong></div>
            <div className="summary-line"><span>Dentist</span><strong>{done.dentist_name}</strong></div>
            <div className="summary-line"><span>When</span><strong>{fmtDate(done.date)}, {fmtTime(done.start_time)}</strong></div>
            <div className="summary-line"><span>Where</span><strong>{done.lab_name}</strong></div>
            <div className="summary-line"><span>Patient</span><strong>{done.patient_name}</strong></div>
            <div className="summary-total"><span>Pay at clinic</span><span>{rupees(done.price_paise)}</span></div>
          </div>
          <Alert kind="info">Please arrive 10 minutes early and bring any previous dental X-rays.</Alert>
          <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
            <Link to="/account/bookings?tab=dental" className="btn btn-primary">View my appointments</Link>
            <Link to="/" className="btn btn-ghost">Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (services.loading || dentists.loading || patients.loading) return <Spinner />

  return (
    <>
      <div className="page-head dental">
        <div className="container">
          <div className="crumbs"><Link to="/dental">Dental care</Link> / Book appointment</div>
          <h1>Book a dental appointment</h1>
          <p>Pick a treatment, a dentist and a time. You pay at the clinic after your visit.</p>
        </div>
      </div>
      <section className="section-sm">
        <div className="container two-col">
          <div className="card">
            <div className="stepper">
              {STEPS.map((s, i) => (
                <Fragment key={s}>
                  {i > 0 && <span className="sep" style={{ alignSelf: 'center' }} />}
                  <div className={i < step ? 'done' : i === step ? 'active' : ''}><span>{i + 1}</span>{s}</div>
                </Fragment>
              ))}
            </div>
            <ErrorBox error={error} />

            {step === 0 && (
              <div className="stack">
                <h3>What do you need?</h3>
                {Object.entries(DENTAL_CATEGORIES).map(([key, label]) => {
                  const list = (services.data || []).filter((s) => s.category === key)
                  if (!list.length) return null
                  return (
                    <div key={key}>
                      <div className="small muted" style={{ fontWeight: 700, margin: '6px 0' }}>{label}</div>
                      <div className="grid grid-2" style={{ gap: 10 }}>
                        {list.map((s) => (
                          <button key={s.id} className={`option-card ${serviceCode === s.code ? 'selected' : ''}`} onClick={() => setServiceCode(s.code)}>
                            <div style={{ flex: 1 }}><strong>{s.name}</strong><small>{s.duration_min} min · {s.description}</small></div>
                            <span className="price" style={{ fontSize: '1rem' }}>{rupees(s.price_paise)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {step === 1 && (
              <div className="stack">
                <div className="row-between">
                  <h3>Choose a dentist</h3>
                  <div className="row">
                    <button className={`chip ${city === '' ? 'active' : ''}`} onClick={() => setCity('')}>All cities</button>
                    {cities.map((c) => <button key={c} className={`chip ${city === c ? 'active' : ''}`} onClick={() => setCity(c)}>{c}</button>)}
                  </div>
                </div>
                {(dentists.data || []).filter((d) => !city || d.city === city).map((d) => (
                  <button key={d.id} className={`option-card ${dentistId === d.id ? 'selected' : ''}`} onClick={() => setDentistId(d.id)}>
                    <div className="brand-mark" style={{ width: 46, height: 46, borderRadius: 14, fontWeight: 800 }}>
                      {d.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>{d.name}</strong>
                      <small>{d.qualification} · {d.specialization} · {d.experience_years} yrs</small>
                      <small style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}><MapPin size={12} /> {d.lab_name} · {fmtTime(d.start_time)}–{fmtTime(d.end_time)}, closed {WEEKDAYS[d.weekly_off]}s</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="stack">
                <h3>Pick a date</h3>
                <div className="date-strip">
                  {nextDays(14).map((d) => {
                    const v = isoDate(d)
                    const off = dentist && d.getDay() === dentist.weekly_off
                    return (
                      <button key={v} className={`date-pill ${date === v ? 'selected' : ''} ${off ? 'off' : ''}`} onClick={() => setDate(v)}>
                        <small>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                        <strong>{d.getDate()}</strong>
                        <small>{d.toLocaleDateString('en-IN', { month: 'short' })}</small>
                      </button>
                    )
                  })}
                </div>
                <h3 style={{ marginTop: 8 }}>Pick a time</h3>
                {slots.loading ? <Spinner /> : slots.error ? <ErrorBox error={slots.error} /> : (slots.data || []).length === 0 ? (
                  <Alert kind="warn">{dentist?.name} does not see patients on {WEEKDAYS[new Date(date + 'T00:00').getDay()]}s. Please choose another day.</Alert>
                ) : (slots.data || []).every((s) => !s.available) ? (
                  <Alert kind="warn">No free times left on this day. Try the next day.</Alert>
                ) : (
                  <div className="slot-grid">
                    {slots.data.map((s) => (
                      <button key={s.start_time} className={`slot ${time === s.start_time ? 'selected' : ''}`} disabled={!s.available} onClick={() => setTime(s.start_time)}>
                        {fmtTime(s.start_time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="stack">
                <div className="row-between">
                  <h3>Who is the appointment for?</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setAdding(true)}><Plus size={15} /> Add family member</button>
                </div>
                {(patients.data || []).length === 0 && <Alert kind="info">Add the person who will visit the dentist.</Alert>}
                <div className="grid grid-2" style={{ gap: 10 }}>
                  {(patients.data || []).map((p) => (
                    <button key={p.id} className={`option-card ${patientId === p.id ? 'selected' : ''}`} onClick={() => setPatientId(p.id)}>
                      <div><strong>{p.name}</strong><small>{p.relation} · {p.gender} · {age(p.dob)} yrs</small></div>
                    </button>
                  ))}
                </div>
                <Field label="Describe the problem (optional)">
                  <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="e.g. Pain in lower left tooth while chewing for 3 days" />
                </Field>
              </div>
            )}

            <div className="row-between" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>
              {step < 3 ? (
                <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button>
              ) : (
                <button className="btn btn-primary" disabled={!canNext || busy} onClick={book}><CalendarCheck size={16} /> {busy ? 'Booking…' : 'Confirm appointment'}</button>
              )}
            </div>
          </div>

          <aside className="card sticky">
            <h3>Your appointment</h3>
            <div className="summary-line"><span>Treatment</span><strong>{service?.name || '—'}</strong></div>
            <div className="summary-line"><span>Dentist</span><strong>{dentist?.name || '—'}</strong></div>
            <div className="summary-line"><span>Clinic</span><strong>{dentist?.lab_name || '—'}</strong></div>
            <div className="summary-line"><span>Date</span><strong>{step >= 2 ? fmtDate(date) : '—'}</strong></div>
            <div className="summary-line"><span>Time</span><strong>{time ? fmtTime(time) : '—'}</strong></div>
            <div className="summary-total"><span>Estimated fee</span><span>{service ? rupees(service.price_paise) : '—'}</span></div>
            <p className="small muted" style={{ marginTop: 10 }}>Final cost depends on the dentist's diagnosis. Pay at the clinic.</p>
          </aside>
        </div>
      </section>

      {adding && (
        <Modal title="Add family member" onClose={() => setAdding(false)}>
          <PatientForm onCancel={() => setAdding(false)} onSaved={(p) => { setAdding(false); setPatientId(p.id); patients.reload() }} />
        </Modal>
      )}
    </>
  )
}
