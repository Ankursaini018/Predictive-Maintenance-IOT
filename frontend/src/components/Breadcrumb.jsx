import { useLocation, Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'

const ROUTE_META = {
  '/':            { label: 'Dashboard',        color: '#00d4ff' },
  '/dashboard':   { label: 'Dashboard',        color: '#00d4ff' },
  '/sensors':     { label: 'Live Sensors',     color: '#00ff88' },
  '/predictions': { label: 'Predictions',      color: '#c084fc' },
  '/shap':        { label: 'Feature Analysis', color: '#ffb300' },
  '/performance': { label: 'Model Performance',color: '#fbbf24' },
}

export default function Breadcrumb() {
  const { pathname } = useLocation()
  const current = ROUTE_META[pathname]
  if (!current || pathname === '/' || pathname === '/dashboard') return null

  return (
    <nav
      className="flex items-center gap-1.5 px-1 mb-4 text-xs"
      aria-label="Breadcrumb"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 transition-colors"
        style={{ color: '#8892a4' }}
        onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
        onMouseLeave={e => e.currentTarget.style.color = '#8892a4'}
      >
        <Home size={11} />
        <span>Home</span>
      </Link>

      <ChevronRight size={11} style={{ color: '#4a5568' }} />

      <span
        className="font-semibold"
        style={{ color: current.color }}
        aria-current="page"
      >
        {current.label}
      </span>
    </nav>
  )
}
