import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Tests from './pages/Tests'
import TestDetail from './pages/TestDetail'
import Packages from './pages/Packages'
import PackageDetail from './pages/PackageDetail'
import Dental from './pages/Dental'
import DentalBook from './pages/DentalBook'
import Centres from './pages/Centres'
import Login from './pages/Login'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyBookings from './pages/MyBookings'
import BookingDetail from './pages/BookingDetail'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import StaffApp from './staff/StaffApp'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tests" element={<Tests />} />
        <Route path="tests/:code" element={<TestDetail />} />
        <Route path="packages" element={<Packages />} />
        <Route path="packages/:code" element={<PackageDetail />} />
        <Route path="dental" element={<Dental />} />
        <Route path="dental/book" element={<RequireAuth roles={['customer']}><DentalBook /></RequireAuth>} />
        <Route path="centres" element={<Centres />} />
        <Route path="login" element={<Login />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<RequireAuth roles={['customer']}><Checkout /></RequireAuth>} />
        <Route path="account/bookings" element={<RequireAuth roles={['customer']}><MyBookings /></RequireAuth>} />
        <Route path="account/bookings/:id" element={<RequireAuth><BookingDetail /></RequireAuth>} />
        <Route path="account/profile" element={<RequireAuth roles={['customer']}><Profile /></RequireAuth>} />
        <Route path="staff/*" element={<RequireAuth roles={['admin', 'phlebotomist', 'lab_technician']}><StaffApp /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
