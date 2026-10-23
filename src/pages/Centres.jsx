import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, MapPin, Phone, Smile, XCircle } from 'lucide-react'
import { api } from '../api'
import { useFetch } from '../hooks'
import { ErrorBox, Spinner } from '../components/ui'

export default function Centres() {
  const labs = useFetch('/labs')
  const [pin, setPin] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const check = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    try {
      setResult(await api.get(`/pincodes/${pin.trim()}/serviceability`))
    } catch (err) {
      setError(err)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / Centres</div>
          <h1>Our centres</h1>
          <p>Walk in for a test or visit our dental clinic. Check whether we collect samples at your home.</p>
        </div>
      </div>
      <section className="section-sm">
        <div className="container stack" style={{ gap: 24 }}>
          <div className="card">
            <h3>Is home collection available at my address?</h3>
            <form className="row" onSubmit={check} style={{ marginTop: 10 }}>
              <input className="input" style={{ maxWidth: 220 }} placeholder="Enter 6-digit pincode" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={6} />
              <button className="btn btn-primary">Check</button>
            </form>
            <div style={{ marginTop: 12 }}>
              <ErrorBox error={error} />
              {result && (result.serviceable && result.home_collection ? (
                <p className="row" style={{ color: 'var(--ok)', fontWeight: 650 }}><CheckCircle2 size={18} /> Yes! We collect at {result.pincode}. Samples go to {result.lab.name}.</p>
              ) : result.serviceable ? (
                <p className="row" style={{ color: 'var(--warn)', fontWeight: 650 }}><Building2 size={18} /> Home collection isn't available here, but you can visit {result.lab.name}.</p>
              ) : (
                <p className="row" style={{ color: 'var(--bad)', fontWeight: 650 }}><XCircle size={18} /> Sorry, we don't serve {result.pincode} yet.</p>
              ))}
            </div>
          </div>
          {labs.loading ? <Spinner /> : (
            <div className="grid grid-3">
              {(labs.data || []).map((l) => (
                <div key={l.id} className="card card-hover">
                  <div className="row-between">
                    <span className="icon-bubble blue"><Building2 size={22} /></span>
                    {l.has_dental && <span className="badge"><Smile size={12} /> Dental clinic</span>}
                  </div>
                  <h3 style={{ marginTop: 12 }}>{l.name}</h3>
                  <p className="row small muted" style={{ alignItems: 'start', flexWrap: 'nowrap' }}><MapPin size={15} style={{ flexShrink: 0, marginTop: 3 }} /> {l.address}, {l.city} – {l.pincode}</p>
                  <p className="row small muted"><Phone size={15} /> {l.phone}</p>
                  <div className="row">
                    <Link to="/tests" className="btn btn-outline btn-sm">Book a test</Link>
                    {l.has_dental && <Link to="/dental/book" className="btn btn-teal btn-sm">Book dentist</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
