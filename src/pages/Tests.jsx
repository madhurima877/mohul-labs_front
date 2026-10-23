import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FlaskConical, Search } from 'lucide-react'
import { useFetch } from '../hooks'
import { TestCard } from '../components/Cards'
import { Empty, ErrorBox, Spinner } from '../components/ui'
import { SAMPLE_LABELS } from '../utils'

const QUICK = ['Thyroid', 'Vitamin', 'Diabetes', 'Liver', 'Kidney', 'Cholesterol']
const QUICK_QUERY = { Diabetes: 'glucose', Cholesterol: 'lipid' }

export default function Tests() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [input, setInput] = useState(q)
  const [sample, setSample] = useState('')
  const { data, error, loading } = useFetch(`/tests?limit=100&q=${encodeURIComponent(q)}`)

  useEffect(() => { setInput(q) }, [q])

  const tests = (data?.items || []).filter((t) => !sample || t.sample_type.startsWith(sample))
  const submit = (e) => {
    e.preventDefault()
    setParams(input.trim() ? { q: input.trim() } : {})
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / Lab tests</div>
          <h1>Lab tests</h1>
          <p>Book individual tests with home sample collection. Prices include the test and the report.</p>
          <form className="hero-search" onSubmit={submit} style={{ marginBottom: 12 }}>
            <Search size={20} style={{ margin: '10px 0 0 10px', color: 'var(--muted)' }} />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search by test name or code" aria-label="Search tests" />
            <button className="btn btn-primary">Search</button>
          </form>
          <div className="row">
            {QUICK.map((k) => {
              const value = QUICK_QUERY[k] || k.toLowerCase()
              return (
                <button key={k} className={`chip ${q === value ? 'active' : ''}`} onClick={() => setParams({ q: value })}>{k}</button>
              )
            })}
            {q && <button className="chip" onClick={() => setParams({})}>Clear search</button>}
          </div>
        </div>
      </div>
      <section className="section-sm">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 18 }}>
            <span className="muted">{loading ? 'Loading…' : `${tests.length} test${tests.length === 1 ? '' : 's'}${q ? ` for “${q}”` : ''}`}</span>
            <div className="row">
              <span className="small muted">Sample:</span>
              {[['', 'All'], ['blood', 'Blood'], ['urine', 'Urine']].map(([v, l]) => (
                <button key={l} className={`chip ${sample === v ? 'active' : ''}`} onClick={() => setSample(v)}>{l}</button>
              ))}
            </div>
          </div>
          <ErrorBox error={error} />
          {loading ? <Spinner /> : tests.length === 0 ? (
            <Empty icon={FlaskConical} title="No tests found">Try another name, like “CBC” or “thyroid”.</Empty>
          ) : (
            <div className="grid grid-3">{tests.map((t) => <TestCard key={t.id} test={t} />)}</div>
          )}
          <p className="small muted center" style={{ marginTop: 24 }}>
            Sample types: {Object.values(SAMPLE_LABELS).slice(0, 4).join(' · ')}
          </p>
        </div>
      </section>
    </>
  )
}
