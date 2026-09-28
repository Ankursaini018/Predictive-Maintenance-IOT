import { useLocation } from 'react-router-dom'
import {
  Bell, Clock, Wifi, Sun, Moon, Check, Trash2,
  AlertTriangle, ShieldAlert, CheckCircle, Menu, X,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAlerts } from './Toast'
import { useTheme } from '../context/ThemeContext'

const routeTitles = {
  '/dashboard':   { title: 'Dashboard',        sub: 'System Overview' },
  '/sensors':     { title: 'Live Sensors',      sub: 'Real-time monitoring' },
  '/predictions': { title: 'Predictions',       sub: 'Failure risk assessment' },
  '/shap':        { title: 'Feature Analysis',  sub: 'SHAP importance breakdown' },
  '/performance': { title: 'Model Performance', sub: 'LightGBM evaluation metrics' },
}

export default function Header({ onToggleMobileMenu, mobileOpen = false }) {
  const { pathname } = useLocation()
  const meta = routeTitles[pathname] || { title: 'PredictIQ', sub: 'Predictive Maintenance' }
  const [time, setTime] = useState(new Date())
  const [bellBounce, setBellBounce] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  const { theme, toggleTheme } = useTheme()
  const { alertCount, alertsHistory, clearAlerts } = useAlerts()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Bounce bell whenever alertCount increases
  const prevCount = useRef(alertCount)
  useEffect(() => {
    if (alertCount > prevCount.current) {
      setBellBounce(true)
      const t = setTimeout(() => setBellBounce(false), 800)
      return () => clearTimeout(t)
    }
    prevCount.current = alertCount
  }, [alertCount])

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fmt = d =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = d =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  const handleBellClick = () => {
    setShowNotifications(prev => !prev)
  }

  return (
    <header
      className="header-bar flex items-center justify-between px-6 py-3.5 shrink-0 border-b relative"
      style={{
        zIndex: 30,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Title + Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        <div>
          <h1 className="header-title text-sm sm:text-base font-bold leading-none tracking-tight">{meta.title}</h1>
          <p className="header-sub text-[11px] sm:text-xs mt-0.5">{meta.sub}</p>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="status-dot live" />
            <span className="text-xs font-medium hidden sm:inline" style={{ color: '#00ff88' }}>System Online</span>
          </div>
          <div className="divider-line h-3.5 w-px hidden md:block" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-subtle">
            <Wifi size={11} style={{ color: '#00d4ff' }} />
            <span>247 machines</span>
          </div>
          <div className="divider-line h-3.5 w-px hidden lg:block" />
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-subtle">
            <Clock size={11} />
            <span className="mono">{fmt(time)}</span>
            <span>·</span>
            <span>{fmtDate(time)}</span>
          </div>
        </div>

        <div className="divider-line h-3.5 w-px hidden sm:block" />

        {/* Machine type badges */}
        <div className="hidden sm:flex items-center gap-1.5">
          {[['H', '#00d4ff'], ['M', '#00ff88'], ['L', '#8892a4']].map(([t, c]) => (
            <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ background: `${c}18`, color: c, border: `1px solid ${c}35` }}>
              {t}
            </span>
          ))}
          <span className="text-xs ml-0.5 text-muted-subtle hidden md:inline">Types</span>
        </div>

        <div className="divider-line h-3.5 w-px" />

        {/* ── 6. Dark / Light Mode Toggle Button ── */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn relative flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Dark / Light Mode"
        >
          {theme === 'dark' ? (
            <Sun
              size={15}
              className="text-amber-400 hover:rotate-90 transition-transform duration-300"
              style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }}
            />
          ) : (
            <Moon
              size={15}
              className="text-indigo-600 hover:-rotate-12 transition-transform duration-300"
              style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' }}
            />
          )}
        </button>

        {/* ── 4. Alert Notifications Bell & Count ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="notif-btn relative flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            aria-label="View alert notifications"
            title={`${alertCount} unread alert${alertCount === 1 ? '' : 's'}`}
          >
            <Bell
              size={14}
              color={alertCount > 0 ? '#ffb300' : '#8892a4'}
              style={{
                transform: bellBounce ? 'rotate(-25deg) scale(1.15)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
            {alertCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{
                  background: '#ff4444',
                  boxShadow: '0 0 8px rgba(255,68,68,0.7)',
                  animation: 'livePulse 2s infinite',
                }}
              >
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div
              className="notif-popover absolute top-full right-0 mt-2.5 w-80 rounded-2xl p-3 shadow-2xl glass z-50 flex flex-col gap-2.5"
              style={{
                maxHeight: '380px',
                animation: 'toastSlideIn 0.25s ease forwards',
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={13} color="#ffb300" />
                  <span className="text-xs font-bold text-header">Live Alerts</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                    style={{ background: 'rgba(255,179,0,0.15)', color: '#ffb300' }}>
                    {alertCount} unread
                  </span>
                </div>
                {alertCount > 0 && (
                  <button
                    onClick={clearAlerts}
                    className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-white"
                    style={{ color: '#00d4ff' }}
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              {/* Alerts List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '260px' }}>
                {alertsHistory.length === 0 ? (
                  <p className="text-xs text-center py-6 text-muted-subtle">No active alerts</p>
                ) : (
                  alertsHistory.map((a) => {
                    const alertColor = a.type === 'error' ? '#ff4444' : a.type === 'warning' ? '#ffb300' : '#00ff88'
                    return (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-xl transition-all"
                        style={{
                          background: `${alertColor}0c`,
                          border: `1px solid ${alertColor}25`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold" style={{ color: alertColor }}>
                            {a.title}
                          </span>
                          <span className="text-[9px] mono text-muted-subtle">{a.time}</span>
                        </div>
                        <p className="text-[11px] leading-tight text-desc">{a.message}</p>
                        {a.machineId && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[9px] mono font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,255,255,0.06)', color: '#00d4ff' }}>
                              {a.machineId}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,150,255,0.3) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
          }}
          title="Ankur Saini — Chief Maintenance Engineer"
        >
          AS
        </div>
      </div>
    </header>
  )
}
