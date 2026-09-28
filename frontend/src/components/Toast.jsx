import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { X, Bell, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react'

/* ── Context ───────────────────────────────────── */
const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx?.addToast ?? (() => {})
}

export function useAlerts() {
  const ctx = useContext(ToastContext)
  return ctx ?? {
    alertCount: 0,
    alertsHistory: [],
    clearAlerts: () => {},
    addToast: () => {},
  }
}

/* ── Single toast component ────────────────────── */
function ToastItem({ id, type, title, message, machineId, time, onRemove }) {
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onRemove(id), 300)
  }, [id, onRemove])

  useEffect(() => {
    const t = setTimeout(dismiss, 4500)
    return () => clearTimeout(t)
  }, [dismiss])

  const Icon = type === 'error' ? AlertTriangle
    : type === 'success' ? CheckCircle
    : type === 'warning' ? ShieldAlert
    : Bell

  const iconColor = type === 'error' ? '#ff4444'
    : type === 'success' ? '#00ff88'
    : type === 'warning' ? '#ffb300'
    : '#00d4ff'

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 mt-0.5"
        style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}35` }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-xs font-bold text-white leading-none tracking-tight">{title}</p>
          <span className="text-[10px] mono" style={{ color: '#8892a4' }}>{time}</span>
        </div>
        {message && <p className="text-[11px] leading-relaxed" style={{ color: '#c8d3e0' }}>{message}</p>}
        {machineId && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[9px] mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
              {machineId}
            </span>
          </div>
        )}
      </div>
      <button onClick={dismiss} className="shrink-0 mt-0.5 p-1 transition-opacity hover:opacity-70" aria-label="Dismiss alert">
        <X size={13} color="#8892a4" />
      </button>
    </div>
  )
}

/* ── Alert Generator Pool ──────────────────────── */
const ALERT_POOL = [
  { type: 'error',   machineId: 'H-005', title: 'Critical Tool Wear',        message: 'Tool wear 194 min exceeds maximum 185 min limit. Immediate replacement recommended.' },
  { type: 'warning', machineId: 'M-003', title: 'Torque Anomaly Warning',     message: 'Torque spike observed at 59.8 Nm on spindle milling cycle.' },
  { type: 'error',   machineId: 'H-005', title: 'Spindle Temperature Alert', message: 'Process temperature exceeded 312.8 K — Heat dissipation failure pattern.' },
  { type: 'warning', machineId: 'H-006', title: 'Speed Variance Detected',   message: 'Rotational speed fluctuation ±260 RPM under heavy forging load.' },
  { type: 'warning', machineId: 'L-002', title: 'Tool Wear Threshold Near',  message: 'Tool wear reached 148 min. Schedule inspection during shift change.' },
  { type: 'info',    machineId: 'L-001', title: 'Routine Cycle Completed',    message: 'Machine L-001 completed 1,500 operations without telemetry variance.' },
  { type: 'success', machineId: 'M-004', title: 'Auto-Calibration Passed',   message: 'Milling center B completed automated multi-sensor self-check.' },
  { type: 'warning', machineId: 'M-003', title: 'Power Threshold Warning',   message: 'Mechanical power dissipation calculated at 2.65 kW (threshold 2.5 kW).' },
]

/* ── Provider ──────────────────────────────────── */
let _id = 0
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [alertCount, setAlertCount] = useState(3)
  const [alertsHistory, setAlertHistory] = useState([
    {
      id: ++_id,
      type: 'error',
      machineId: 'H-005',
      title: 'Critical Failure Risk',
      message: 'Machine H-005 — 94% failure probability detected (TWF mode)',
      time: '19:54:12',
    },
    {
      id: ++_id,
      type: 'warning',
      machineId: 'M-003',
      title: 'Torque Warning',
      message: 'Machine M-003 — Spindle resistance near warning threshold (56.4 Nm)',
      time: '19:48:07',
    },
    {
      id: ++_id,
      type: 'info',
      machineId: 'L-001',
      title: 'Telemetry Sync',
      message: 'Telemetry synced across all 6 machines',
      time: '19:41:30',
    },
  ])

  const addToast = useCallback(({ type = 'info', title, message, machineId }) => {
    const id = ++_id
    const timeStr = new Date().toTimeString().split(' ')[0]
    const item = { id, type, title, message, machineId, time: timeStr }
    setToasts(prev => [item, ...prev.slice(0, 4)]) // Keep max 5 visible toasts at once
    setAlertHistory(prev => [item, ...prev.slice(0, 19)])
    setAlertCount(c => c + 1)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAlerts = useCallback(() => {
    setAlertCount(0)
  }, [])

  /* 4. Alert notifications: Every 15 seconds randomly generate one new alert notification */
  const poolIndexRef = useRef(0)
  useEffect(() => {
    const iv = setInterval(() => {
      const alertTemplate = ALERT_POOL[poolIndexRef.current % ALERT_POOL.length]
      poolIndexRef.current++
      addToast(alertTemplate)
    }, 15000)

    return () => clearInterval(iv)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast, alertCount, alertsHistory, clearAlerts }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
