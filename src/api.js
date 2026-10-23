// Thin wrapper over the two Mohul Labs Go services (proxied by Vite):
//   /api/v1        customer API  (website)
//   /staff-api/v1  staff API     (separate service for front desk, lab, phlebotomists, admin)
// A session belongs to one portal, and every request goes to that portal's service, so staff screens
// never wait on the customer API.
const BASES = { customer: '/api/v1', staff: '/staff-api/v1' }
const SESSION_KEY = 'mohul_session'

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY))
    return s && s.token && BASES[s.portal] ? s : null
  } catch {
    return null
  }
}

export function setSession(token, portal) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, JSON.stringify({ token, portal }))
    else localStorage.removeItem(SESSION_KEY)
  } catch { /* storage unavailable: stay logged in for this tab only */ }
}

export const getToken = () => getSession()?.token || null

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const SERVICE_NAME = { customer: 'Mohul Labs API on :8080', staff: 'Mohul Labs staff service on :8081' }

// portal overrides the session's portal, e.g. the staff login page before a staff session exists.
async function request(method, path, body, portal) {
  const session = getSession()
  const target = portal || session?.portal || 'customer'
  const headers = {}
  if (session && session.portal === target) headers.Authorization = `Bearer ${session.token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(BASES[target] + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'NETWORK', `Cannot reach the server. Is the ${SERVICE_NAME[target]} running?`)
  }
  if (res.status === 204) return null
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && headers.Authorization) {
      // Lets the staff sign-in page explain why (deactivated, password reset, signed out by owner).
      if (target === 'staff') {
        try { sessionStorage.setItem('mohul_session_ended', '1') } catch { /* ignore */ }
      }
      setSession(null)
      window.dispatchEvent(new Event('mohul:logout'))
    }
    // Vite answers 5xx with no JSON body when the Go service behind the proxy is down.
    if (res.status >= 500 && !json.error) {
      throw new ApiError(res.status, 'NETWORK', `Cannot reach the server. Is the ${SERVICE_NAME[target]} running?`)
    }
    const e = json.error || {}
    throw new ApiError(res.status, e.code || 'ERROR', e.message || `Request failed (${res.status})`)
  }
  return json.meta ? { items: json.data, meta: json.meta } : json.data
}

export const api = {
  get: (p, portal) => request('GET', p, undefined, portal),
  post: (p, b = {}, portal) => request('POST', p, b, portal),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),

  // Reports are files behind auth, so fetch them as a blob and open in a new tab.
  async openReport(reportId) {
    const session = getSession()
    const res = await fetch(`${BASES[session?.portal || 'customer']}/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${session?.token}` },
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new ApiError(res.status, json.error?.code, json.error?.message || 'Could not download report')
    }
    const url = URL.createObjectURL(await res.blob())
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },
}
