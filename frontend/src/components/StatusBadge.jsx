const variants = {
  healthy:  { color: '#00ff88', bg: 'rgba(0,255,136,0.1)',  border: 'rgba(0,255,136,0.25)',  dot: 'live'    },
  warning:  { color: '#ffb300', bg: 'rgba(255,179,0,0.1)', border: 'rgba(255,179,0,0.25)', dot: 'warning' },
  danger:   { color: '#ff4444', bg: 'rgba(255,68,68,0.1)',  border: 'rgba(255,68,68,0.25)', dot: 'danger'  },
  inactive: { color: '#8892a4', bg: 'rgba(136,146,164,0.08)', border: 'rgba(136,146,164,0.2)', dot: ''   },
  running:  { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.25)',  dot: 'live'    },
}

export default function StatusBadge({ status = 'inactive', label, showDot = true }) {
  const v = variants[status] || variants.inactive
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}
    >
      {showDot && v.dot && <span className={`status-dot ${v.dot}`} style={{ width: 6, height: 6 }} />}
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
