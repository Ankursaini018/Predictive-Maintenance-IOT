import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  BarChart3,
  TrendingUp,
  Zap,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/live-sensors',      icon: Activity,        label: 'Live Sensors' },
  { to: '/predictions',       icon: BrainCircuit,    label: 'Predictions' },
  { to: '/feature-analysis',  icon: BarChart3,       label: 'Feature Analysis' },
  { to: '/model-performance', icon: TrendingUp,      label: 'Model Performance' },
]

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col w-[220px] shrink-0 h-full border-r"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.35)' }}
        >
          <Zap size={16} color="#00d4ff" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-white leading-none">PredictIQ</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#8892a4' }}>IoT Monitor</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] uppercase tracking-widest" style={{ color: '#8892a4' }}>Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer select-none ${
                isActive ? 'nav-active' : 'text-[#8892a4]'
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Help' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left"
            style={{ color: '#8892a4' }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}

        {/* Version badge */}
        <div className="mt-3 mx-1 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <p className="text-[10px] font-medium" style={{ color: '#00d4ff' }}>LightGBM v1.0</p>
          <p className="text-[10px]" style={{ color: '#8892a4' }}>57 features · SMOTE</p>
        </div>
      </div>
    </aside>
  )
}
