import { Link } from 'react-router-dom'
import { Check, Clock, Droplet, Plus, Utensils } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { rupees, SAMPLE_LABELS } from '../utils'

function CartButton({ item }) {
  const { has, toggle } = useCart()
  const inCart = has(item.code)
  return (
    <button className={`btn btn-sm ${inCart ? 'btn-outline' : 'btn-brand'}`} onClick={() => toggle(item)}>
      {inCart ? <><Check size={15} /> Added</> : <><Plus size={15} /> Add</>}
    </button>
  )
}

export function TestCard({ test }) {
  return (
    <div className="card card-hover stack" style={{ gap: 0 }}>
      <div className="card-title-row">
        <h3><Link to={`/tests/${test.code}`} style={{ color: 'inherit' }}>{test.name}</Link></h3>
      </div>
      <div className="meta-list">
        <span><Droplet size={14} /> {SAMPLE_LABELS[test.sample_type]}</span>
        <span><Clock size={14} /> Report in {test.tat_hours} hrs</span>
        {test.fasting_required && <span><Utensils size={14} /> 10–12 hr fasting</span>}
      </div>
      <div className="row-between" style={{ marginTop: 'auto' }}>
        <span className="price">{rupees(test.price_paise)}</span>
        <CartButton item={{ type: 'test', code: test.code, name: test.name, price: test.price_paise }} />
      </div>
    </div>
  )
}

export function PackageCard({ pkg, featured }) {
  const tests = pkg.tests || []
  const params = tests.length
  return (
    <div className="card card-hover stack" style={{ gap: 0, borderTop: featured ? '4px solid var(--brand-500)' : undefined }}>
      <div className="row-between">
        <span className="badge badge-accent">{params} tests included</span>
        {featured && <span className="badge">Most booked</span>}
      </div>
      <h3 style={{ marginTop: 12 }}><Link to={`/packages/${pkg.code}`} style={{ color: 'inherit' }}>{pkg.name}</Link></h3>
      <p className="muted small">{pkg.description}</p>
      <ul className="small" style={{ paddingLeft: 18, margin: '0 0 14px', color: 'var(--ink-soft)' }}>
        {tests.slice(0, 4).map((t) => <li key={t.id}>{t.name}</li>)}
        {tests.length > 4 && <li className="muted">+ {tests.length - 4} more</li>}
      </ul>
      <div className="row-between" style={{ marginTop: 'auto' }}>
        <span className="price">{rupees(pkg.price_paise)}</span>
        <CartButton item={{ type: 'package', code: pkg.code, name: pkg.name, price: pkg.price_paise, includes: tests.map((t) => t.code) }} />
      </div>
    </div>
  )
}
