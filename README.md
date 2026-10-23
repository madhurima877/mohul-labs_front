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
go run ./cmd/staff-api
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

Open http://localhost:5173. Vite proxies `/api` to the customer API on `:8080` and `/staff-api` to the
separate staff service on `:8081`, so there is no CORS setup. If you see `http proxy error ... ECONNREFUSED`
in the Vite terminal, the Go service for that path isn't running.

## Logging in

**Customers** use **Login** with their phone number and an OTP. In development the OTP is shown on screen,
so no SMS is needed. Any new 10-digit mobile number becomes a customer account.

**Staff** use the **Staff** button in the header (or *Staff portal* in the footer). It opens `/staff/login`,
where they sign in with the **work email and password the owner gave them**. That sign-in talks only to the
staff service. The session stays open for the whole shift while the portal is open, because the token is
refreshed in the background. If the owner deactivates someone, resets their password or signs them out,
their next click lands back on the sign-in page with a note saying so.

Who creates whom:
1. **Master** (you, exactly one) is created on the server: `go run ./cmd/master -email you@example.com`.
2. The master signs in through **Staff**, opens **Owners & staff** and creates the business **owner**.
3. The owner signs in through the same **Staff** button and creates staff under **Staff accounts**.

| Role | Lands on |
|---|---|
| master | `/staff`: everything an owner sees, plus Owners & staff |
| owner | `/staff`: everything an admin sees, plus revenue and Staff accounts |
| admin | `/staff`: dashboard (no revenue), bookings, front desk, dental desk, lab |
| lab technician | `/staff`: front desk, sample accession, results |
| phlebotomist | `/staff`: today's home collections |

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
- Front desk (admin and lab technician): register a **walk-in** at the counter. By default there is **no
  phone**: staff type the customer's name (person 1 defaults to it), gender and age (or date of birth).
  If the customer wants the report sent directly, **+ Add phone or email** opens a box for a mobile number
  (with *Find returning customer*, which brings up their saved family) and/or an email. Add tests by typing their name, mark payment received, register, then draw the samples on the
  same screen. Phone and email are **optional**: the screen shows each test's price and turnaround,
  when the report is expected, and how it will reach the customer (SMS link, email, or "collect at the
  lab" when neither is given).
  The **Dental** tab on the same screen books a dentist for today instead: pick the patient, dentist and
  treatment, take "Next free" or a specific time, and optionally check the patient in straight away.
- Lab: barcode receive / reject, walk-in desk, and results entry that flags abnormal values while you type.
  Saved values are locked: a wrong one is **voided with a reason** and entered again, and nothing changes
  after approval. Booked tests and catalog tests are never edited either: cancel and create a new one.
- Approving a patient's results generates the report.
- Booking page (staff): expected report time, when the report was sent, and **Send report** (optionally to a
  newly given email).

## Phones

The whole site and the staff portal work on phones (checked at 375px and 320px wide):
- Tables (bookings, dental desk, samples, results, staff accounts, test details) turn into one card per
  row with a label on each line. `components/responsiveTables.js` copies each column header onto its cells
  as `data-label`; the card layout is the `@media (max-width: 640px)` block in `index.css`.
- Text boxes are 16px on phones, so iPhones don't zoom in when you tap one.
- Checkout has a sticky bar with the total and the pay button.
- The staff menu becomes a horizontal strip under the header.

## Layout

```
src/
  api.js            fetch wrapper: picks the customer or staff service from the session's portal
  hooks.js          useFetch
  utils.js          money/date formatting, labels
  context/          AuthContext (user, portal, staff token refresh), CartContext (persisted cart + toast)
  components/       Layout (topbar, navbar, footer), cards, forms, small UI pieces
  pages/            customer pages
  staff/            staff portal
```

`npm run build` writes a static build to `dist/`.
# mohul-labs_front
