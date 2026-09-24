import { Link, useLocation } from 'react-router-dom'
import { Home, AlertTriangle, ArrowLeft, Wifi } from 'lucide-react'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-6 page-enter"
    >
      {/* Glow blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,68,68,0.07) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: '50%', top: '50%',
          filter: 'blur(40px)',
        }}
      />

      {/* Icon */}
      <div
        className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6 relative"
        style={{
          background: 'rgba(255,68,68,0.1)',
          border: '1px solid rgba(255,68,68,0.3)',
          boxShadow: '0 0 40px rgba(255,68,68,0.15)',
        }}
      >
        <AlertTriangle size={36} color="#ff4444" />
        {/* Wifi slash to hint at "lost connection / unknown route" */}
        <div
          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: '#0a0f1e', border: '1px solid rgba(255,68,68,0.3)' }}
        >
          <Wifi size={13} color="#ff4444" />
        </div>
      </div>

      {/* 404 */}
      <p
        className="text-8xl font-black mono mb-2 leading-none"
        style={{
          background: 'linear-gradient(135deg, #ff4444 0%, #ff7070 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        404
      </p>

      <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>

      <p className="text-sm max-w-sm leading-relaxed mb-1" style={{ color: '#8892a4' }}>
        The route{' '}
        <code
          className="px-2 py-0.5 rounded-md text-xs mono"
          style={{
            background: 'rgba(255,68,68,0.12)',
            border: '1px solid rgba(255,68,68,0.25)',
            color: '#ff7070',
          }}
        >
          {pathname}
        </code>{' '}
        doesn't exist in this dashboard.
      </p>
      <p className="text-xs mb-8" style={{ color: '#4a5568' }}>
        Valid routes: / · /sensors · /predictions · /shap · /performance
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(0,150,255,0.25) 100%)',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
            boxShadow: '0 4px 16px rgba(0,212,255,0.15)',
          }}
        >
          <Home size={14} />
          Go to Dashboard
        </Link>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#8892a4',
          }}
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
      </div>

      {/* System status strip */}
      <div
        className="mt-10 px-5 py-3 rounded-xl flex items-center gap-3"
        style={{
          background: 'rgba(0,255,136,0.06)',
          border: '1px solid rgba(0,255,136,0.15)',
        }}
      >
        <span className="status-dot live" />
        <span className="text-xs" style={{ color: '#8892a4' }}>
          PredictIQ system is <span style={{ color: '#00ff88' }}>online</span> · 247 machines monitored
        </span>
      </div>
    </div>
  )
}
