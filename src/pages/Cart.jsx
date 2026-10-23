import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Package, ShoppingCart, TestTube, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Alert, Empty } from '../components/ui'
import { rupees } from '../utils'

// cartConflicts lists tests in the cart that are already part of a package in the cart.
export function cartConflicts(items) {
  const inPackages = new Map()
  items.filter((i) => i.type === 'package').forEach((p) => (p.includes || []).forEach((c) => inPackages.set(c, p.name)))
  return items.filter((i) => i.type === 'test' && inPackages.has(i.code)).map((i) => `${i.name} is already in ${inPackages.get(i.code)}`)
}

export default function Cart() {
  const { items, remove, total } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const conflicts = cartConflicts(items)

  if (items.length === 0) {
    return (
      <div className="container section">
        <Empty icon={ShoppingCart} title="Your cart is empty">
          <p>Add lab tests or a health package to book a sample collection.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/tests" className="btn btn-primary">Browse tests</Link>
            <Link to="/packages" className="btn btn-outline">Health packages</Link>
          </div>
        </Empty>
      </div>
    )
  }

  return (
    <div className="container section-sm">
      <h1>Your cart</h1>
      <div className="two-col" style={{ marginTop: 18 }}>
        <div className="card">
          {conflicts.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Alert kind="warn">{conflicts.map((c) => <div key={c}>{c} — remove the separate test to avoid paying twice.</div>)}</Alert>
            </div>
          )}
          {items.map((i) => (
            <div key={i.code} className="list-row">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <span className={`icon-bubble ${i.type === 'test' ? 'blue' : ''}`}>{i.type === 'test' ? <TestTube size={20} /> : <Package size={20} />}</span>
                <div>
                  <strong>{i.name}</strong>
                  <div className="small muted">{i.type === 'package' ? `Package · ${i.includes?.length || 0} tests` : 'Lab test'}</div>
                </div>
              </div>
              <div className="row">
                <span className="price" style={{ fontSize: '1rem' }}>{rupees(i.price)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(i.code)} aria-label={`Remove ${i.name}`}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}><Link to="/tests">+ Add more tests</Link></div>
        </div>
        <aside className="card sticky">
          <h3>Order summary</h3>
          <div className="summary-line"><span>{items.length} item{items.length > 1 ? 's' : ''} (per person)</span><span>{rupees(total)}</span></div>
          <p className="small muted">You'll choose family members, home or centre visit, and a slot next. Home collection is free on orders of {rupees(100000)}+.</p>
          <button className="btn btn-primary btn-block" disabled={conflicts.length > 0}
            onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })}>
            {user ? 'Continue to booking' : 'Login to continue'} <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </div>
  )
}
