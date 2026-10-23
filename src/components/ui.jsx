import { AlertCircle, CheckCircle2, Info, Inbox, X } from 'lucide-react'
import { STATUS_TONE, titleCase } from '../utils'

export const Spinner = () => <div className="spinner" role="status" aria-label="Loading" />

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="empty">
      <Icon size={44} />
      <h3>{title}</h3>
      {children && <div>{children}</div>}
    </div>
  )
}

const ALERT_ICON = { error: AlertCircle, ok: CheckCircle2, info: Info, warn: AlertCircle }

export function Alert({ kind = 'info', children }) {
  if (!children) return null
  const Icon = ALERT_ICON[kind]
  return (
    <div className={`alert alert-${kind}`}>
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}

export function ErrorBox({ error }) {
  return error ? <Alert kind="error">{error.message || String(error)}</Alert> : null
}

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status]
  return <span className={`badge ${tone ? 'badge-' + tone : ''}`}>{titleCase(status)}</span>
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
