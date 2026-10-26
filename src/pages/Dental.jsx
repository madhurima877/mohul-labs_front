import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CalendarCheck, Clock, MapPin, ShieldCheck, Smile, Sparkles } from 'lucide-react'
import { useFetch } from '../hooks'
import { ErrorBox, Spinner } from '../components/ui'
import { DENTAL_CATEGORIES, fmtTime, rupees, WEEKDAYS } from '../utils'
import { DentalIcon } from './Home'

export default function Dental() {
  const services = useFetch('/dental/services')
  const dentists = useFetch('/dental/dentists')
  const [cat, setCat] = useState('')

  const list = (services.data || []).filter((s) => !cat || s.category === cat)
  const cats = [...new Set((services.data || []).map((s) => s.category))]

  return (
    <>
      <div className="page-head dental">
        <div className="container">
          <div className="crumbs">Home / Dental care</div>
          <div className="row-between">
            <div>
              <h1>Mohul Dental Care</h1>
              <p>From your first check-up to a complete smile makeover. Transparent prices, sterilised instruments,
                and dentists who explain every step.</p>
            </div>
            <Link to="/dental/book" className="btn btn-primary btn-lg"><CalendarCheck size={18} /> Book appointment</Link>
          </div>
          <div className="hero-badges" style={{ marginTop: 18 }}>
            <span><ShieldCheck size={16} /> Autoclave-sterilised instruments</span>
            <span><Sparkles size={16} /> Digital X-rays</span>
            <span><Smile size={16} /> Child-friendly dentists</span>
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          <div className="section-head"><div><h2>Treatments & prices</h2><p>Prices are per tooth or per visit as described.</p></div></div>
          <div className="row" style={{ marginBottom: 18 }}>
            <button className={`chip ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>All</button>
            {cats.map((c) => (
              <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{DENTAL_CATEGORIES[c]}</button>
            ))}
          </div>
          <ErrorBox error={services.error} />
          {services.loading ? <Spinner /> : (
            <div className="grid grid-3">
              {list.map((s) => (
                <div key={s.id} className="card card-hover stack" style={{ gap: 0 }}>
                  <div className="row-between">
                    <span className="icon-bubble"><DentalIcon code={s.code} /></span>
                    <span className="badge">{DENTAL_CATEGORIES[s.category]}</span>
                  </div>
                  <h3 style={{ marginTop: 12 }}>{s.name}</h3>
                  <p className="muted small">{s.description}</p>
                  <div className="meta-list"><span><Clock size={14} /> About {s.duration_min} min</span></div>
                  <div className="row-between" style={{ marginTop: 'auto' }}>
                    <span className="price">{rupees(s.price_paise)}</span>
                    <Link to={`/dental/book?service=${s.code}`} className="btn btn-brand btn-sm">Book</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" id="dentists" style={{ background: '#fff', borderTop: '1px solid var(--line)' }}>
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Our team</span><h2>Meet our dentists</h2></div></div>
          {dentists.loading ? <Spinner /> : (
            <div className="grid grid-2">
              {(dentists.data || []).map((d) => (
                <div key={d.id} className="card" style={{ display: 'flex', gap: 16 }}>
                  <div className="brand-mark" style={{ width: 64, height: 64, borderRadius: 18, fontSize: '1.4rem', fontWeight: 800, flexShrink: 0 }}>
                    {d.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 2 }}>{d.name}</h3>
                    <div className="small" style={{ color: 'var(--brand-700)', fontWeight: 650 }}>{d.qualification}</div>
                    <p className="small muted" style={{ margin: '6px 0' }}>{d.bio}</p>
                    <div className="meta-list" style={{ margin: '6px 0 12px' }}>
                      <span><Award size={14} /> {d.experience_years} yrs</span>
                      <span><MapPin size={14} /> {d.lab_name}</span>
                      <span><Clock size={14} /> {fmtTime(d.start_time)} – {fmtTime(d.end_time)}, closed {WEEKDAYS[d.weekly_off]}</span>
                    </div>
                    <Link to={`/dental/book?dentist=${d.id}`} className="btn btn-outline btn-sm">Book with {d.name.split(' ')[1]}</Link>
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
