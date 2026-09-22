import { useLocation } from 'react-router-dom'
import { Bell, Clock, Wifi } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useToast } from './Toast'

const routeTitles = {
  '/dashboard':         { title: 'Dashboard',        sub: 'System Overview' },
  '/live-sensors':      { title: 'Live Sensors',      sub: 'Real-time monitoring' },
  '/predictions':       { title: 'Predictions',       sub: 'Failure risk assessment' },
  '/feature-analysis':  { title: 'Feature Analysis',  sub: 'SHAP importance breakdown' },
  '/model-performance': { title: 'Model Performance', sub: 'LightGBM evaluation metrics' },
}

const QUICK_ALERTS = [
  { type: 'error',   title: 'Critical Alert',       message: 'Machine M-7823 — Failure probability 97%' },
  { type: 'warning', title: 'Tool Wear Warning',    message: 'Machine H-5502 — Replace tool within 2h' },
  { type: 'success', title: 'Model Sync Complete',  message: 'Batch inference on 247 machines finished' },
  { type: 'info',    title: 'Sensor Data Updated',  message: 'Live stream reconnected — L-001 to L-010' },
]

export default function Header() {
  const { pathname } = useLocation()
  const meta = routeTitles[pathname] || { title: 'PredictIQ', sub: '' }
  const [time, setTime] = useState(new Date())
  const [bellBounce, setBellBounce] = useState(false)
  const [alertCount, setAlertCount] = useState(3)
  const addToast = useToast()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* Bell animates every 12s to signal new alert */
  useEffect(() => {
    const iv = setInterval(() => {
      setBellBounce(true)
      setTimeout(() => setBellBounce(false), 700)
    }, 12000)
    return () => clearInterval(iv)
  }, [])

  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  const handleBell = () => {
    const alert = QUICK_ALERTS[Math.floor(Math.random() * QUICK_ALERTS.length)]
    addToast(alert)
    setAlertCount(c => Math.max(0, c - 1))
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 shrink-0 border-b"
      style={{
        background: 'rgba(10,15,30,0.8)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 20,
      }}
    >
      {/* Title */}
      <div>
        <h1 className="text-base font-bold text-white leading-none tracking-tight">{meta.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>{meta.sub}</p>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="status-dot live" />
            <span className="text-xs font-medium" style={{ color: '#00ff88' }}>System Online</span>
          </div>
          <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
            <Wifi size={11} style={{ color: '#00d4ff' }} />
            <span>247 machines</span>
          </div>
          <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
            <Clock size={11} />
            <span className="mono">{fmt(time)}</span>
            <span>·</span>
            <span>{fmtDate(time)}</span>
          </div>
        </div>

        <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Machine type badges */}
        <div className="flex items-center gap-1.5">
          {[['H', '#00d4ff'], ['M', '#00ff88'], ['L', '#8892a4']].map(([t, c]) => (
            <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}>
              {t}
            </span>
          ))}
          <span className="text-xs ml-1" style={{ color: '#8892a4' }}>Types</span>
        </div>

        <div className="h-3.5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Bell / alert button */}
        <button
          onClick={handleBell}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Notifications"
        >
          <Bell
            size={14}
            color={alertCount > 0 ? '#ffb300' : '#8892a4'}
            style={{ transform: bellBounce ? 'rotate(-20deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
          />
          {alertCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: '#ff4444', color: '#fff', animation: 'livePulse 2s infinite' }}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,150,255,0.3) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
          }}
          title="Ankur Saini — Engineer"
        >
          AS
        </div>
      </div>
    </header>
  )
}
