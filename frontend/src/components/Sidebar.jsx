import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Activity, BrainCircuit,
  BarChart3, TrendingUp, Zap, Settings,
  HelpCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',         color: '#00d4ff' },
  { to: '/live-sensors',      icon: Activity,        label: 'Live Sensors',       color: '#00ff88' },
  { to: '/predictions',       icon: BrainCircuit,    label: 'Predictions',        color: '#c084fc' },
  { to: '/feature-analysis',  icon: BarChart3,       label: 'Feature Analysis',   color: '#ffb300' },
  { to: '/model-performance', icon: TrendingUp,      label: 'Model Performance',  color: '#fbbf24' },
]

export default function Sidebar() {
  /* auto-collapse on small screens */
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1025)

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 1025)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const W = collapsed ? 64 : 220

  return (
    <aside
      className="sidebar flex flex-col h-full border-r shrink-0 relative"
      style={{
        width: W,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center px-4 py-5 border-b shrink-0 gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: 64 }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{
            background: 'rgba(0,212,255,0.15)',
            border: '1px solid rgba(0,212,255,0.35)',
            boxShadow: '0 0 12px rgba(0,212,255,0.2)',
          }}
        >
          <Zap size={16} color="#00d4ff" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap" style={{ animation: 'fadeUp 0.25s ease' }}>
            <p className="text-sm font-bold tracking-wide text-white leading-none">PredictIQ</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#8892a4' }}>IoT Monitor v1.0</p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] uppercase tracking-widest whitespace-nowrap"
            style={{ color: '#8892a4', animation: 'fadeUp 0.3s ease' }}>
            Navigation
          </p>
        )}

        {NAV_ITEMS.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer select-none w-full ${
                isActive ? 'nav-active' : 'text-[#8892a4]'
              }`
            }
            style={({ isActive }) => isActive ? { color } : {}}
          >
            {({ isActive }) => (
              <>
                <div
                  className="shrink-0 flex items-center justify-center w-5 h-5"
                  style={{ color: isActive ? color : undefined }}
                >
                  <Icon size={16} />
                </div>
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2 pb-3 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[
          { icon: Settings,   label: 'Settings' },
          { icon: HelpCircle, label: 'Help' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={collapsed ? label : undefined}
            className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left"
            style={{ color: '#8892a4' }}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </button>
        ))}

        {/* Model badge */}
        {!collapsed && (
          <div className="sidebar-badge mt-2 mx-1 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <p className="text-[10px] font-semibold" style={{ color: '#00d4ff' }}>LightGBM v1.0</p>
            <p className="text-[9px] mt-0.5" style={{ color: '#8892a4' }}>57 features · SMOTE · F1 0.93</p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="mt-2 flex items-center justify-center w-full py-2 rounded-xl transition-all text-xs gap-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#8892a4',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
