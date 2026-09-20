import { useLocation } from 'react-router-dom'
import { Bell, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

const routeTitles = {
  '/dashboard':         { title: 'Dashboard',        sub: 'System Overview' },
  '/live-sensors':      { title: 'Live Sensors',      sub: 'Real-time monitoring' },
  '/predictions':       { title: 'Predictions',       sub: 'Failure risk assessment' },
  '/feature-analysis':  { title: 'Feature Analysis',  sub: 'SHAP importance breakdown' },
  '/model-performance': { title: 'Model Performance', sub: 'LightGBM evaluation metrics' },
}

export default function Header() {
  const { pathname } = useLocation()
  const meta = routeTitles[pathname] || { title: 'PredictIQ', sub: '' }
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 shrink-0 border-b"
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Title */}
      <div>
        <h1 className="text-base font-semibold text-white leading-none">{meta.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>{meta.sub}</p>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="status-dot live" />
            <span className="text-xs font-medium" style={{ color: '#00ff88' }}>System Online</span>
          </div>
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
            <Clock size={12} />
            <span className="mono">{fmt(time)}</span>
            <span>·</span>
            <span>{fmtDate(time)}</span>
          </div>
        </div>

        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Machine type badges */}
        <div className="flex items-center gap-1.5">
          {[['H', '#00d4ff'], ['M', '#00ff88'], ['L', '#8892a4']].map(([t, c]) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}
            >
              {t}
            </span>
          ))}
          <span className="text-xs ml-1" style={{ color: '#8892a4' }}>Machine Types</span>
        </div>

        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Alerts */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Notifications"
        >
          <Bell size={14} color="#8892a4" />
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ background: '#ff4444', color: '#fff' }}
          >
            3
          </span>
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,150,255,0.3) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
          }}
        >
          AS
        </div>
      </div>
    </header>
  )
}
