export const rupees = (paise) =>
  '₹' + (Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const pad = (n) => String(n).padStart(2, '0')

// YYYY-MM-DD for a Date in the browser's local time (the clinic is in India, as are users).
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const nextDays = (count, from = new Date()) => Array.from({ length: count }, (_, i) => addDays(from, i))

export const fmtDate = (v) =>
  new Date(typeof v === 'string' && v.length === 10 ? v + 'T00:00:00' : v)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtDateTime = (v) =>
  new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const fmtTime = (hm) => {
  if (!hm) return ''
  const [h, m] = hm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ampm}`
}

export const age = (dob) => {
  const d = new Date(dob)
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const SAMPLE_LABELS = {
  blood_edta: 'Blood (EDTA)',
  blood_serum: 'Blood (Serum)',
  blood_fluoride: 'Blood (Fluoride)',
  urine: 'Urine',
  stool: 'Stool',
  swab: 'Swab',
}

export const BOOKING_STEPS = [
  { key: 'booked', label: 'Booking confirmed' },
  { key: 'phlebotomist_assigned', label: 'Phlebotomist assigned' },
  { key: 'sample_collected', label: 'Sample collected' },
  { key: 'received_at_lab', label: 'Received at lab' },
  { key: 'processing', label: 'Testing in progress' },
  { key: 'report_ready', label: 'Report ready' },
]

export const STATUS_TONE = {
  booked: 'blue',
  phlebotomist_assigned: 'blue',
  sample_collected: '',
  received_at_lab: '',
  processing: 'warn',
  report_ready: 'ok',
  recollection_required: 'bad',
  cancelled: 'grey',
  checked_in: 'warn',
  completed: 'ok',
  no_show: 'grey',
}

export const DENTAL_CATEGORIES = {
  consultation: 'Consultation & X-ray',
  preventive: 'Cleaning & Prevention',
  restorative: 'Fillings & Crowns',
  endodontic: 'Root Canal',
  cosmetic: 'Cosmetic',
  orthodontic: 'Braces & Aligners',
  surgical: 'Extractions & Surgery',
  pediatric: 'Kids Dentistry',
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
