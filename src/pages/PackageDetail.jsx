import { Link, useParams } from 'react-router-dom'
import { Check, Plus, Utensils } from 'lucide-react'
import { useFetch } from '../hooks'
import { useCart } from '../context/CartContext'
import { ErrorBox, Spinner } from '../components/ui'
import { rupees, SAMPLE_LABELS } from '../utils'

export default function PackageDetail() {
  const { code } = useParams()
  const { data: p, error, loading } = useFetch(`/packages/${encodeURIComponent(code)}`)
  const { has, toggle } = useCart()

  if (loading) return <Spinner />
  if (error) return <div className="container section"><ErrorBox error={error} /></div>

  const tests = p.tests || []
  const separate = tests.reduce((s, t) => s + t.price_paise, 0)
  const fasting = tests.some((t) => t.fasting_required)
  const inCart = has(p.code)

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs"><Link to="/packages">Health packages</Link> / {p.code}</div>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
        </div>
      </div>
      <section className="section-sm">
        <div className="container two-col">
          <div className="card">
            <h3>{tests.length} tests included</h3>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th>Test</th><th>Sample</th><th>Report in</th><th>Price alone</th></tr></thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id}>
                      <td><Link to={`/tests/${t.code}`}>{t.name}</Link></td>
                      <td>{SAMPLE_LABELS[t.sample_type]}</td>
                      <td>{t.tat_hours} hrs</td>
                      <td>{rupees(t.price_paise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fasting && <p className="row small" style={{ marginTop: 12 }}><Utensils size={16} color="var(--brand-600)" /> Needs 10–12 hours fasting — book an early-morning slot.</p>}
          </div>
          <aside className="card sticky">
            <span className="price" style={{ fontSize: '1.6rem' }}>{rupees(p.price_paise)}</span>
            {separate > p.price_paise && (
              <p className="small" style={{ color: 'var(--ok)', fontWeight: 650 }}>
                You save {rupees(separate - p.price_paise)} vs booking these tests separately ({rupees(separate)}).
              </p>
            )}
            <button className={`btn btn-block ${inCart ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle({ type: 'package', code: p.code, name: p.name, price: p.price_paise, includes: tests.map((t) => t.code) })}>
              {inCart ? <><Check size={16} /> In cart — remove</> : <><Plus size={16} /> Add to cart</>}
            </button>
            {inCart && <Link to="/cart" className="btn btn-brand btn-block" style={{ marginTop: 8 }}>Go to cart</Link>}
          </aside>
        </div>
      </section>
    </>
  )
}
