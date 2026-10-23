import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ClipboardList, FlaskConical, LayoutDashboard, Microscope, Smile, Truck, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AdminDashboard from './AdminDashboard'
import AdminBookings from './AdminBookings'
import AdminDental from './AdminDental'
import Collections from './Collections'
import Accession from './Accession'
import Results from './Results'
import FrontDesk from './FrontDesk'
import StaffAccounts from './StaffAccounts'

const MENU = {
  admin: [
    ['', 'Dashboard', LayoutDashboard, <AdminDashboard key="d" />],
    ['bookings', 'Lab bookings', ClipboardList, <AdminBookings key="b" />],
    ['desk', 'Front desk (walk-in)', UserPlus, <FrontDesk key="fd" />],
    ['dental', 'Dental appointments', Smile, <AdminDental key="dn" />],
    ['accession', 'Sample accession', FlaskConical, <Accession key="a" />],
    ['results', 'Results & reports', Microscope, <Results key="r" />],
  ],
  phlebotomist: [['', 'My collections', Truck, <Collections key="c" />]],
  lab_technician: [
    ['', 'Front desk (walk-in)', UserPlus, <FrontDesk key="fd" />],
    ['accession', 'Sample accession', FlaskConical, <Accession key="a" />],
    ['results', 'Results & reports', Microscope, <Results key="r" />],
  ],
}
// The owner sees everything an admin does, plus staff account management.
MENU.owner = [...MENU.admin, ['team', 'Staff accounts', Users, <StaffAccounts key="t" />]]
// The master (one per installation) sees what an owner sees and also creates owners there.
MENU.master = [...MENU.admin, ['team', 'Owners & staff', Users, <StaffAccounts key="t" />]]

export default function StaffApp() {
  const { user } = useAuth()
  const menu = MENU[user.role] || []
  return (
    <div className="staff-shell">
      <aside className="staff-side">
        <div className="small muted" style={{ padding: '0 12px 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {user.role.replace('_', ' ')}
        </div>
        {menu.map(([path, label, Icon]) => (
          <NavLink key={path} to={`/staff/${path}`} end><Icon size={18} /> {label}</NavLink>
        ))}
      </aside>
      <div className="staff-main">
        <Routes>
          {menu.map(([path, , , el]) => <Route key={path} path={path || undefined} index={!path} element={el} />)}
          <Route path="*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </div>
    </div>
  )
}
