import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarCheck, CheckCircle2, ChevronDown, Clock, FlaskConical, LayoutDashboard, LogOut, Mail, Menu,
  MapPin, Phone, ShoppingCart, Smile, User, Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Mohul Labs home">
      <span className="brand-mark">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3c-3 4-5.5 7-5.5 10.5a5.5 5.5 0 0 0 11 0C17.5 10 15 7 12 3z" fill="#fff" />
          <path d="M9.5 14h5M12 11.5v5" stroke="#14a39a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span>
        <span className="brand-name">Mohul Labs</span>
        <br />
        <span className="brand-sub">Pathology · Dental</span>
      </span>
    </Link>
  )
}

function UserMenu() {
  const { user, logout, isStaff } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="user-menu" ref={ref}>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen((o) => !o)}>
        <User size={16} /> <span className="user-label">{user.name || 'My account'}</span> <ChevronDown size={14} />
      </button>
      {open && (
        <div className="dropdown" onClick={() => setOpen(false)}>
          {isStaff ? (
            <Link to="/staff"><LayoutDashboard size={16} /> Staff dashboard</Link>
          ) : (
            <>
              <Link to="/account/bookings"><CalendarCheck size={16} /> My bookings</Link>
              <Link to="/account/profile"><Users size={16} /> Family & addresses</Link>
            </>
          )}
          <hr />
          <button onClick={() => { logout(); navigate('/') }}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  )
}

function Navbar() {
  const { user, isStaff } = useAuth()
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <header className="nav">
      <div className="container">
        <Logo />
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/tests">Lab Tests</NavLink>
          <NavLink to="/packages">Health Packages</NavLink>
          <NavLink to="/dental">Dental Care</NavLink>
          <NavLink to="/centres">Centres</NavLink>
          {isStaff && <NavLink to="/staff">Staff</NavLink>}
        </nav>
        <div className="nav-actions">
          {!isStaff && (
            <Link to="/cart" className="btn btn-ghost cart-btn" aria-label="Cart">
              <ShoppingCart size={20} />
              {items.length > 0 && <span className="cart-count">{items.length}</span>}
            </Link>
          )}
          {user ? <UserMenu /> : <Link to="/login" className="btn btn-primary btn-sm">Login</Link>}
          <button className="btn btn-ghost menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Mohul Labs</h4>
            <p>Pathology tests and a full-service dental clinic under one roof. Home sample collection
              across Kolkata and Delhi.</p>
            <p className="row small"><Phone size={14} /> 1800-123-6645 (toll free)</p>
            <p className="row small"><Mail size={14} /> care@mohullabs.in</p>
          </div>
          <div>
            <h4>Pathology</h4>
            <Link to="/tests">All lab tests</Link>
            <Link to="/packages">Health packages</Link>
            <Link to="/tests?q=thyroid">Thyroid tests</Link>
            <Link to="/tests?q=vitamin">Vitamin tests</Link>
          </div>
          <div>
            <h4>Dental</h4>
            <Link to="/dental">Treatments</Link>
            <Link to="/dental#dentists">Our dentists</Link>
            <Link to="/dental/book">Book appointment</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link to="/centres">Find a centre</Link>
            <Link to="/account/bookings">Track booking</Link>
            <Link to="/account/bookings">Download reports</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Mohul Labs. All rights reserved.</span>
          <span>Reports are for use by a registered medical practitioner.</span>
        </div>
      </div>
    </footer>
  )
}

function Toast() {
  const { toast } = useCart()
  if (!toast) return null
  return <div className="toast"><CheckCircle2 size={18} /> {toast}</div>
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const staff = pathname.startsWith('/staff')
  return (
    <>
      {!staff && (
        <div className="topbar">
          <div className="container">
            <span><Phone size={13} /> 1800-123-6645</span>
            <span className="hide-sm"><Clock size={13} /> Collection 7 AM – 1 PM · Dental 10 AM – 8 PM</span>
            <span className="hide-sm"><MapPin size={13} /> Kolkata · New Delhi</span>
            <span><FlaskConical size={13} /> <Smile size={13} /> Pathology + Dental</span>
          </div>
        </div>
      )}
      <Navbar />
      <main><Outlet /></main>
      {!staff && <Footer />}
      <Toast />
    </>
  )
}
