# Mohul Labs — web app

React frontend for Mohul Labs, a pathology lab and dental clinic (Lal PathLabs-style). It talks to the Go
backend in `/var/www/html/gocode/src/mohul_labs`.

**Stack:** React 18 · React Router 6 · Vite 5 · lucide-react icons · plain CSS (teal-to-blue theme in
`src/index.css`).

## Run it

Start the backend first (from `/var/www/html/gocode/src/mohul_labs`):

```bash
docker-compose up -d postgres redis
```
```bash
go run ./cmd/api
```
```bash
go run ./cmd/worker
```

Then the frontend (from this folder):

```bash
npm install
```
```bash
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the Go API on `:8080`, so there is no CORS setup.

## Logging in

Login is by phone OTP. In development the OTP is shown on the login screen, so no SMS is needed.

| Phone | Role | Lands on |
|---|---|---|
| any new 10-digit mobile | customer | website |
| 9000000001 | admin | `/staff` — dashboard, bookings, dental desk, lab |
| 9000000002 | phlebotomist | `/staff` — today's home collections |
| 9000000003 | lab technician | `/staff` — sample accession, results |

## What's in it

**Customers**
- Home: search, popular tests, packages, dental treatments, how it works.
- Lab tests and health packages, with sample type, report time, fasting and parameters with reference ranges.
- Cart → checkout: choose family members, home collection (pincode check) or centre visit, date and slot,
  pay online or at collection. Online payment goes through a **test gateway** (no real money).
- Dental care: treatments by category with prices, dentist profiles, and a 4-step booking wizard
  (treatment → dentist → date and time → patient).
- My bookings: lab bookings with a status timeline, samples, and report download; dental appointments with
  the dentist's notes and cancellation.
- Family members and saved addresses.

**Staff** (`/staff`, menu depends on role)
- Admin dashboard, lab bookings with phlebotomist assignment, and the dental front desk
  (check in → complete with notes / no-show / cancel).
- Phlebotomist: today's collections with address, cash collection, and barcodes to label tubes.
- Lab: barcode receive / reject, walk-in desk, and results entry that flags abnormal values while you type,
  then approve to generate the report.

## Layout

```
src/
  api.js            fetch wrapper (JWT in localStorage, error shape, report download)
  hooks.js          useFetch
  utils.js          money/date formatting, labels
  context/          AuthContext (user + token), CartContext (persisted cart + toast)
  components/       Layout (topbar, navbar, footer), cards, forms, small UI pieces
  pages/            customer pages
  staff/            staff portal
```

`npm run build` writes a static build to `dist/`.
# mohul-labs_front
