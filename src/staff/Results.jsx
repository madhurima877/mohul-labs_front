import { useEffect, useState } from 'react'
import { Ban, CheckCircle2, Lock, Microscope, Save } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { Alert, Empty, ErrorBox, Spinner, StatusBadge } from '../components/ui'
import { fmtDate } from '../utils'

const range = (p) => {
  if (p.ref_low != null && p.ref_high != null) return `${p.ref_low} – ${p.ref_high}`
  if (p.ref_text) return p.ref_text
  if (p.ref_high != null) return `< ${p.ref_high}`
  if (p.ref_low != null) return `> ${p.ref_low}`
  return '—'
}

// Same rule the server uses, so the technician sees the flag while typing.
const isAbnormal = (p, v) => {
  const value = String(v ?? '').trim()
  if (!value) return false
  const n = Number(value)
  if (Number.isNaN(n)) return p.ref_low == null && p.ref_high == null && p.ref_text ? value.toLowerCase() !== p.ref_text.toLowerCase() : false
  return (p.ref_low != null && n < p.ref_low) || (p.ref_high != null && n > p.ref_high)
}

// Saved values are locked. A wrong one is voided with a reason (kept for audit) and entered again.
// Once the report is approved nothing on the sheet can change.
function PatientSheet({ bookingId, patient, onChanged }) {
  const [values, setValues] = useState({}) // typed values for parameters that have no saved value yet
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { setValues({}) }, [patient])

  const params = patient.tests.flatMap((t) => t.parameters)
  const saved = (p) => p.value != null
  const typed = (p) => String(values[p.id] ?? '').trim()
  const missing = params.filter((p) => !saved(p) && !typed(p)).length
  const unsavedCount = params.filter((p) => !saved(p) && typed(p)).length
  const base = `/lab/bookings/${bookingId}/patients/${patient.patient_id}`

  const run = async (approve) => {
    setBusy(true)
    setError(null)
    setMsg('')
    try {
      const results = params.filter((p) => !saved(p) && typed(p)).map((p) => ({ parameter_id: p.id, value: typed(p) }))
      if (results.length) await api.post(`${base}/results`, { results })
      if (approve) {
        await api.post(`${base}/approve`)
        setMsg('Approved — results are now final and the report is being generated.')
      } else {
        setMsg(results.length ? `${results.length} value(s) saved and locked.` : 'Nothing new to save.')
      }
      onChanged()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const voidValue = async (p) => {
    const reason = window.prompt(`Void "${p.value}" for ${p.name}?\nThe old value is kept for audit. Reason (required):`, '')
    if (reason === null) return
    setBusy(true)
    setError(null)
    setMsg('')
    try {
      await api.post(`${base}/results/${p.id}/void`, { reason })
      setMsg(`${p.name} voided — enter the corrected value.`)
      onChanged()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={patient.approved ? { borderLeft: '4px solid var(--ok)' } : undefined}>
      <div className="row-between">
        <h3 style={{ margin: 0 }}>{patient.patient_name}</h3>
        {patient.approved
          ? <span className="badge badge-ok"><Lock size={12} /> Approved — final</span>
          : <span className="small muted">{params.length - missing}/{params.length} values entered</span>}
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {patient.tests.map((t) => (
          <div key={t.test_id}>
            <div className="small" style={{ fontWeight: 700, color: 'var(--accent-700)', marginBottom: 6 }}>{t.name}</div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Parameter</th><th style={{ width: 170 }}>Result</th><th>Unit</th><th>Reference</th><th></th></tr></thead>
                <tbody>
                  {t.parameters.map((p) => {
                    const shown = saved(p) ? p.value : values[p.id]
                    const bad = saved(p) ? Boolean(p.is_abnormal) : isAbnormal(p, values[p.id])
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          {saved(p) ? (
                            <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                              <Lock size={13} color="var(--muted)" />
                              <strong className={bad ? 'abnormal' : undefined}>{shown}</strong>
                            </span>
                          ) : (
                            <input className="input" value={shown ?? ''} disabled={patient.approved}
                              onChange={(e) => setValues({ ...values, [p.id]: e.target.value })}
                              style={bad ? { borderColor: 'var(--bad)', color: 'var(--bad)', fontWeight: 700 } : undefined} />
                          )}
                        </td>
                        <td className="small">{p.unit || '—'}</td>
                        <td className="small muted">{range(p)}</td>
                        <td>
                          <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                            {bad && <span className="badge badge-bad">Abnormal</span>}
                            {saved(p) && !patient.approved && (
                              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => voidValue(p)} title="Void this value and re-enter">
                                <Ban size={14} /> Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}><ErrorBox error={error} />{msg && <Alert kind="ok">{msg}</Alert>}</div>
      {!patient.approved && (
        <>
          <p className="small muted" style={{ marginTop: 10 }}>Saved values are locked. To correct one, use <strong>Void</strong> with a reason and enter it again.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" disabled={busy || unsavedCount === 0} onClick={() => run(false)}><Save size={16} /> Save values</button>
            <button className="btn btn-primary" disabled={busy || missing > 0} onClick={() => run(true)} title={missing ? 'Enter every value first' : ''}>
              <CheckCircle2 size={16} /> Save & approve report
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Results() {
  const received = useFetch('/lab/bookings?status=received_at_lab&limit=100')
  const processing = useFetch('/lab/bookings?status=processing&limit=100')
  const [selected, setSelected] = useState(null)
  const sheet = useFetch(selected ? `/lab/bookings/${selected}/worksheet` : null)

  const list = [...(processing.data?.items || []), ...(received.data?.items || [])]
  const reloadAll = () => {
    received.reload()
    processing.reload()
    sheet.reload()
    // The report is built by the background worker; refresh again once it has had time to finish.
    setTimeout(() => { received.reload(); processing.reload() }, 2500)
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div><h2>Results & reports</h2><p className="muted" style={{ margin: 0 }}>Bookings whose samples are all in the lab. Enter values, then approve each patient's report.</p></div>
      {received.loading || processing.loading ? <Spinner /> : list.length === 0 ? (
        <Empty icon={Microscope} title="Nothing waiting for results">Receive samples on the accession page first.</Empty>
      ) : (
        <div className="row">
          {list.map((b) => (
            <button key={b.id} className={`option-card ${selected === b.id ? 'selected' : ''}`} style={{ width: 'auto' }} onClick={() => setSelected(b.id)}>
              <div><strong>{b.booking_no}</strong><small>{fmtDate(b.slot_date)} · <StatusBadge status={b.status} /></small></div>
            </button>
          ))}
        </div>
      )}
      {selected && (sheet.loading ? <Spinner /> : sheet.error ? <ErrorBox error={sheet.error} /> : (
        <div className="stack" style={{ gap: 18 }}>
          {(sheet.data || []).map((p) => <PatientSheet key={p.patient_id} bookingId={selected} patient={p} onChanged={reloadAll} />)}
        </div>
      ))}
    </div>
  )
}
