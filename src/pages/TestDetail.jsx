import { Link, useParams } from 'react-router-dom'
import { Check, Clock, Droplet, Home, Plus, Utensils } from 'lucide-react'
import { useFetch } from '../hooks'
import { useCart } from '../context/CartContext'
import { ErrorBox, Spinner } from '../components/ui'
import { rupees, SAMPLE_LABELS } from '../utils'

const range = (p) => {
  if (p.ref_low != null && p.ref_high != null) return `${p.ref_low} – ${p.ref_high}`
  if (p.ref_text) return p.ref_text
  if (p.ref_high != null) return `< ${p.ref_high}`
  if (p.ref_low != null) return `> ${p.ref_low}`
  return '—'
}

export default function TestDetail() {
  const { code } = useParams()
  const { data: t, error, loading } = useFetch(`/tests/${encodeURIComponent(code)}`)
  const { has, toggle } = useCart()

  if (loading) return <Spinner />
  if (error) return <div className="container section"><ErrorBox error={error} /></div>

  const inCart = has(t.code)
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs"><Link to="/tests">Lab tests</Link> / {t.code}</div>
          <h1>{t.name}</h1>
          <p>{t.description}</p>
        </div>
      </div>
      <section className="section-sm">
        <div className="container two-col">
          <div className="stack">
            <div className="card">
              <h3>Test details</h3>
              <div className="grid grid-3" style={{ marginTop: 12 }}>
                <div className="feature"><span className="icon-bubble accent"><Droplet size={20} /></span><div><h3>Sample</h3><p>{SAMPLE_LABELS[t.sample_type]}</p></div></div>
                <div className="feature"><span className="icon-bubble"><Clock size={20} /></span><div><h3>Report time</h3><p>Within {t.tat_hours} hours</p></div></div>
                <div className="feature"><span className="icon-bubble accent"><Utensils size={20} /></span><div><h3>Preparation</h3><p>{t.fasting_required ? '10–12 hours fasting (water is fine)' : 'No fasting needed'}</p></div></div>
              </div>
            </div>
            <div className="card">
              <h3>What it measures ({t.parameters?.length || 0} parameters)</h3>
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table className="table">
                  <thead><tr><th>Parameter</th><th>Unit</th><th>Reference range</th></tr></thead>
                  <tbody>
                    {(t.parameters || []).map((p) => (
                      <tr key={p.id}><td>{p.name}</td><td>{p.unit || '—'}</td><td>{range(p)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted" style={{ marginTop: 10 }}>Reference ranges are for adults; your doctor will interpret results for you.</p>
            </div>
          </div>
          <aside className="card sticky">
            <span className="price" style={{ fontSize: '1.6rem' }}>{rupees(t.price_paise)}</span>
            <p className="small muted">Includes sample collection kit and online report.</p>
            <button className={`btn btn-block ${inCart ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle({ type: 'test', code: t.code, name: t.name, price: t.price_paise })}>
              {inCart ? <><Check size={16} /> In cart — remove</> : <><Plus size={16} /> Add to cart</>}
            </button>
            {inCart && <Link to="/cart" className="btn btn-brand btn-block" style={{ marginTop: 8 }}>Go to cart</Link>}
            <div className="divider" />
            <p className="row small"><Home size={16} color="var(--brand-600)" /> Free home collection on orders of {rupees(100000)}+</p>
          </aside>
        </div>
      </section>
    </>
  )
}
