import { Link } from 'react-router-dom'
import { useFetch } from '../hooks'
import { ErrorBox, Spinner, StatusBadge } from '../components/ui'
import { fmtTime, isoDate, rupees } from '../utils'

const ORDER = ['booked', 'phlebotomist_assigned', 'sample_collected', 'received_at_lab', 'processing', 'recollection_required', 'report_ready', 'cancelled']

export default function AdminDashboard() {
  const stats = useFetch('/admin/stats')
  const dental = useFetch(`/admin/dental/appointments?date=${isoDate(new Date())}`)

  if (stats.loading) return <Spinner />
  const s = stats.data
  return (
    <div className="stack" style={{ gap: 22 }}>
      <div><h2>Dashboard</h2><p className="muted">Today at a glance.</p></div>
      <ErrorBox error={stats.error} />
      {s && (
        <>
          <div className="grid grid-4">
            <div className="stat-card"><strong>{s.bookings_created_today}</strong><span>Lab bookings created today</span></div>
            <div className="stat-card"><strong>{rupees(s.revenue_paise_today)}</strong><span>Paid lab revenue today</span></div>
            <div className="stat-card"><strong>{s.pending_reports}</strong><span>Reports waiting to generate</span></div>
            <div className="stat-card"><strong>{(dental.data || []).filter((a) => a.status !== 'cancelled').length}</strong><span>Dental appointments today</span></div>
          </div>
          <div className="card">
            <h3>Lab bookings by status</h3>
            <div className="row" style={{ marginTop: 10 }}>
              {ORDER.map((k) => (
                <Link key={k} to={`/staff/bookings?status=${k}`} className="chip" style={{ textDecoration: 'none' }}>
                  <StatusBadge status={k} /> <strong>{s.bookings_by_status[k] || 0}</strong>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="card">
        <div className="row-between"><h3>Today's dental chair</h3><Link to="/staff/dental">Manage</Link></div>
        {(dental.data || []).length === 0 ? <p className="muted small">No dental appointments today.</p> : (
          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="table">
              <thead><tr><th>Time</th><th>Patient</th><th>Treatment</th><th>Dentist</th><th>Status</th></tr></thead>
              <tbody>
                {dental.data.map((a) => (
                  <tr key={a.id}><td>{fmtTime(a.start_time)}</td><td>{a.patient_name}</td><td>{a.service_name}</td><td>{a.dentist_name}</td><td><StatusBadge status={a.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
