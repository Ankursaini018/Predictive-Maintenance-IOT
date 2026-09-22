import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'

/* ── Context ───────────────────────────────────── */
const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

/* ── Single toast ──────────────────────────────── */
function Toast({ id, type, title, message, onRemove }) {
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onRemove(id), 300)
  }, [id, onRemove])

  useEffect(() => {
    const t = setTimeout(dismiss, 3500)
    return () => clearTimeout(t)
  }, [dismiss])

  const Icon = type === 'error' ? AlertTriangle
    : type === 'success' ? CheckCircle
    : type === 'warning' ? AlertTriangle
    : Bell

  const iconColor = type === 'error' ? '#ff4444'
    : type === 'success' ? '#00ff88'
    : type === 'warning' ? '#ffb300'
    : '#00d4ff'

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}>
      <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
        style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}35` }}>
        <Icon size={13} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white leading-none mb-0.5">{title}</p>
        {message && <p className="text-[11px] leading-relaxed" style={{ color: '#8892a4' }}>{message}</p>}
      </div>
      <button onClick={dismiss} className="shrink-0 mt-0.5 transition-opacity hover:opacity-70">
        <X size={13} color="#8892a4" />
      </button>
    </div>
  )
}

/* ── Provider ──────────────────────────────────── */
let _id = 0
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'info', title, message }) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, type, title, message }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  /* Periodic demo toasts for portfolio wow-factor */
  const cycleRef = useRef(0)
  useEffect(() => {
    const TOASTS = [
      { type: 'warning', title: 'Active Alert',         message: 'Machine M-7823 — Tool Wear threshold exceeded' },
      { type: 'error',   title: 'Failure Predicted',    message: 'Machine H-5502 — 83% failure probability detected' },
      { type: 'success', title: 'Prediction Complete',  message: 'Batch inference on 247 machines finished' },
      { type: 'info',    title: 'New Sensor Reading',   message: 'Live data updated — RPM spike on L-3319' },
    ]
    const iv = setInterval(() => {
      addToast(TOASTS[cycleRef.current % TOASTS.length])
      cycleRef.current++
    }, 9000)
    // Show first one after 2s
    const first = setTimeout(() => addToast(TOASTS[0]), 2000)
    return () => { clearInterval(iv); clearTimeout(first) }
  }, [addToast])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
