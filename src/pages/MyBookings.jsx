import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock, FlaskConical, MapPin, Smile, Stethoscope } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Empty, ErrorBox, Spinner, StatusBadge } from '../components/ui'
import { fmtDate, fmtTime, rupees, titleCase } from '../utils'

export default function MyBookings() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'dental' ? 'dental' : 'lab'
  return (
    <div className="container section-sm">
      <h1>My bookings</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'lab' ? 'active' : ''}`} onClick={() => setParams({})}><FlaskConical size={16} /> Lab tests</button>
        <button className={`tab ${tab === 'dental' ? 'active' : ''}`} onClick={() => setParams({ tab: 'dental' })}><Smile size={16} /> Dental appointments</button>
      </div>
      {tab === 'lab' ? <LabBookings /> : <DentalAppointments />}
    </div>
  )
}

function LabBookings() {
  const { data, error, loading } = useFetch('/bookings?limit=50')
  if (loading) return <Spinner />
  const list = data?.items || []
  return (
    <>
      <ErrorBox error={error} />
      {list.length === 0 ? (
        <Empty icon={FlaskConical} title="No lab bookings yet"><Link to="/tests" className="btn btn-primary">Book a test</Link></Empty>
      ) : (
        <div className="stack">
          {list.map((b) => (
            <Link key={b.id} to={`/account/bookings/${b.id}`} className="card card-hover row-between" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="row">
                <span className="icon-bubble accent"><FlaskConical size={20} /></span>
                <div>
                  <strong>{b.booking_no}</strong>
                  <div className="meta-list" style={{ margin: '4px 0 0' }}>
                    <span><CalendarDays size={14} /> {fmtDate(b.slot_date)}, {fmtTime(b.slot_start)}</span>
                    <span><MapPin size={14} /> {b.collection_type === 'home' ? 'Home collection' : 'Centre visit'}</span>
                  </div>
                </div>
              </div>
              <div className="row">
                <span className="price" style={{ fontSize: '1rem' }}>{rupees(b.total_paise)}</span>
                <StatusBadge status={b.status} />
                <ChevronRight size={18} color="var(--muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function DentalAppointments() {
  const { data, error, loading, reload } = useFetch('/dental/appointments')
  const [cancelErr, setCancelErr] = useState(null)

  const cancel = async (a) => {
    if (!window.confirm(`Cancel your ${a.service_name} appointment on ${fmtDate(a.date)}?`)) return
    setCancelErr(null)
    try {
      await api.post(`/dental/appointments/${a.id}/cancel`, { reason: 'Cancelled by patient' })
      reload()
    } catch (err) {
      setCancelErr(err)
    }
  }

  if (loading) return <Spinner />
  return (
    <>
      <ErrorBox error={error || cancelErr} />
      {(data || []).length === 0 ? (
        <Empty icon={Smile} title="No dental appointments yet"><Link to="/dental/book" className="btn btn-primary">Book a dentist</Link></Empty>
      ) : (
        <div className="grid grid-2">
          {data.map((a) => (
            <div key={a.id} className="card">
              <div className="row-between">
                <span className="kbd">{a.appointment_no}</span>
                <StatusBadge status={a.status} />
              </div>
              <h3 style={{ marginTop: 12 }}>{a.service_name}</h3>
              <div className="meta-list">
                <span><Stethoscope size={14} /> {a.dentist_name}</span>
                <span><CalendarDays size={14} /> {fmtDate(a.date)}</span>
                <span><Clock size={14} /> {fmtTime(a.start_time)}</span>
                <span><MapPin size={14} /> {a.lab_name}</span>
              </div>
              <p className="small">For <strong>{a.patient_name}</strong> · Fee {rupees(a.price_paise)} (pay at clinic)</p>
              {a.notes && <p className="small muted">Your note: {a.notes}</p>}
              {a.dentist_notes && <p className="small" style={{ background: 'var(--brand-50)', padding: 10, borderRadius: 8 }}><strong>Dentist's notes:</strong> {a.dentist_notes}</p>}
              {a.status === 'cancelled' && a.cancel_reason && <p className="small muted">{titleCase(a.status)}: {a.cancel_reason}</p>}
              {a.status === 'booked' && <button className="btn btn-danger btn-sm" onClick={() => cancel(a)}>Cancel appointment</button>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
