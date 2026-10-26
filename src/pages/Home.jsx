import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, CalendarClock, FileText, FlaskConical, Home as HomeIcon, Search, ShieldCheck,
  Smile, Sparkles, Stethoscope, Syringe, Timer,
} from 'lucide-react'
import { useFetch } from '../hooks'
import { PackageCard, TestCard } from '../components/Cards'
import { Spinner } from '../components/ui'
import { rupees } from '../utils'

const POPULAR = ['CBC', 'T3T4', 'HBA1C', 'VITD', 'LIPID', 'LFT', 'KFT', 'VITB12']

export default function Home() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const tests = useFetch('/tests?limit=50')
  const packages = useFetch('/packages')
  const dental = useFetch('/dental/services')

  const popular = (tests.data?.items || []).filter((t) => POPULAR.includes(t.code))
    .sort((a, b) => POPULAR.indexOf(a.code) - POPULAR.indexOf(b.code)).slice(0, 4)
  const featuredDental = (dental.data || []).filter((s) => ['D-CONSULT', 'D-SCALE', 'D-RCT', 'D-WHITEN'].includes(s.code))

  const search = (e) => {
    e.preventDefault()
    navigate(`/tests${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Pathology lab + dental clinic</span>
            <h1>Healthy body, healthy smile — <span style={{ color: 'var(--brand-600)' }}>one trusted place.</span></h1>
            <p className="lead">
              Book blood tests with free home sample collection, get reports online, and see our dentists for
              everything from a check-up to a root canal.
            </p>
            <form className="hero-search" onSubmit={search}>
              <Search size={20} style={{ margin: '10px 0 0 10px', color: 'var(--muted)' }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tests: CBC, thyroid, vitamin D…" aria-label="Search tests" />
              <button className="btn btn-primary">Search</button>
            </form>
            <div className="hero-badges">
              <span><HomeIcon size={16} /> Home collection</span>
              <span><Timer size={16} /> Reports in 12–48 hrs</span>
              <span><ShieldCheck size={16} /> Doctor-reviewed reports</span>
            </div>
          </div>
          <div className="hero-panel">
            <h3>What would you like to do?</h3>
            <div className="split-cta" style={{ marginTop: 12 }}>
              <Link to="/tests">
                <span className="icon-bubble accent"><FlaskConical size={22} /></span>
                <span><strong>Book a lab test</strong><small>Blood, urine & more — at home or at a centre</small></span>
                <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </Link>
              <Link to="/packages">
                <span className="icon-bubble"><BadgeCheck size={22} /></span>
                <span><strong>Full body check-up</strong><small>Packages from {rupees(99900)}</small></span>
                <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </Link>
              <Link to="/dental/book">
                <span className="icon-bubble"><Smile size={22} /></span>
                <span><strong>Book a dentist</strong><small>Check-ups, cleaning, RCT, braces</small></span>
                <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </Link>
              <Link to="/account/bookings">
                <span className="icon-bubble accent"><FileText size={22} /></span>
                <span><strong>Download reports</strong><small>Track your booking status</small></span>
                <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stats-strip">
          <div><strong>11+</strong><span>Lab tests</span></div>
          <div><strong>13</strong><span>Dental treatments</span></div>
          <div><strong>3</strong><span>Centres</span></div>
          <div><strong>Free</strong><span>Home collection on {rupees(100000)}+</span></div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Pathology</span>
              <h2>Popular lab tests</h2>
              <p>The tests doctors ask for most often.</p>
            </div>
            <Link to="/tests" className="btn btn-outline">View all tests <ArrowRight size={16} /></Link>
          </div>
          {tests.loading ? <Spinner /> : (
            <div className="grid grid-4">{popular.map((t) => <TestCard key={t.id} test={t} />)}</div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Health packages</span>
              <h2>Complete check-ups, one sample</h2>
              <p>Bundled tests cost less than booking them one by one.</p>
            </div>
            <Link to="/packages" className="btn btn-outline">All packages <ArrowRight size={16} /></Link>
          </div>
          {packages.loading ? <Spinner /> : (
            <div className="grid grid-3">
              {(packages.data || []).map((p, i) => <PackageCard key={p.id} pkg={p} featured={i === 1} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Dental care</span>
              <h2>Gentle dentistry for the whole family</h2>
              <p>Experienced dentists, modern equipment, and clear prices before you sit in the chair.</p>
            </div>
            <Link to="/dental" className="btn btn-outline">All treatments <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-4">
            {featuredDental.map((s) => (
              <div key={s.id} className="card card-hover">
                <span className="icon-bubble"><DentalIcon code={s.code} /></span>
                <h3 style={{ marginTop: 12 }}>{s.name}</h3>
                <p className="muted small">{s.description}</p>
                <div className="row-between">
                  <span className="price">{rupees(s.price_paise)}</span>
                  <Link to={`/dental/book?service=${s.code}`} className="btn btn-brand btn-sm">Book</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">How it works</span><h2>Lab tests from your sofa</h2></div></div>
          <div className="steps">
            <div className="step"><h3>Book online</h3><p>Pick tests or a package and a time slot that suits you.</p></div>
            <div className="step"><h3>We come to you</h3><p>A trained phlebotomist collects your sample at home.</p></div>
            <div className="step"><h3>Tested in our lab</h3><p>Every sample is barcoded and tracked from your door to the analyser.</p></div>
            <div className="step"><h3>Report online</h3><p>Get an SMS and download your report from My Bookings.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            <div className="feature"><span className="icon-bubble"><Syringe size={22} /></span><div><h3>Safe, single-use kits</h3><p>Sealed needles and tubes opened in front of you.</p></div></div>
            <div className="feature"><span className="icon-bubble accent"><CalendarClock size={22} /></span><div><h3>Slots that fit your day</h3><p>Early-morning collections for fasting tests, evening dental chairs.</p></div></div>
            <div className="feature"><span className="icon-bubble"><Stethoscope size={22} /></span><div><h3>Reviewed reports</h3><p>Out-of-range values are clearly flagged for your doctor.</p></div></div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="band">
            <div>
              <h2><Sparkles size={22} /> Time for a dental check-up?</h2>
              <p>Most problems are cheaper to fix early. A consultation is just {rupees(50000)}.</p>
            </div>
            <Link to="/dental/book" className="btn btn-outline btn-lg">Book a dentist</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export function DentalIcon({ code }) {
  if (code === 'D-WHITEN') return <Sparkles size={22} />
  if (code === 'D-CONSULT' || code === 'D-KIDS') return <Stethoscope size={22} />
  return <Smile size={22} />
}
