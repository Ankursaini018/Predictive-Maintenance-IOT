import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Thermometer, Wind, Zap, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'

/* ── Sensor config ─────────────────────────────────────── */
const SENSORS = [
  {
    key: 'airTemp',
    label: 'Air Temperature',
    unit: 'K',
    icon: Thermometer,
    color: '#00d4ff',
    base: 300.0,
    noise: 1.8,
    warningHigh: 304,
    dangerHigh: 306,
  },
  {
    key: 'procTemp',
    label: 'Process Temperature',
    unit: 'K',
    icon: Wind,
    color: '#00ff88',
    base: 310.5,
    noise: 1.2,
    warningHigh: 313,
    dangerHigh: 315,
  },
  {
    key: 'rpm',
    label: 'Rotational Speed',
    unit: 'RPM',
    icon: Settings,
    color: '#ffb300',
    base: 1500,
    noise: 80,
    warningHigh: 1700,
    dangerHigh: 1800,
  },
  {
    key: 'torque',
    label: 'Torque',
    unit: 'Nm',
    icon: Zap,
    color: '#ff4444',
    base: 40,
    noise: 8,
    warningHigh: 55,
    dangerHigh: 65,
  },
]

const MAX_POINTS = 40

function generatePoint(sensor, prev) {
  const drift = prev ? (prev - sensor.base) * 0.15 : 0
  const v = (prev || sensor.base) - drift + (Math.random() - 0.5) * sensor.noise * 2
  return Math.round(v * 10) / 10
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="font-medium text-white mb-1">t={label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  )
}

function SensorChart({ sensor, data }) {
  const Icon = sensor.icon
  const latest = data.length ? data[data.length - 1][sensor.key] : sensor.base
  const isWarning = latest >= sensor.warningHigh && latest < sensor.dangerHigh
  const isDanger  = latest >= sensor.dangerHigh
  const status    = isDanger ? 'danger' : isWarning ? 'warning' : 'healthy'
  const statusColor = isDanger ? '#ff4444' : isWarning ? '#ffb300' : '#00ff88'

  return (
    <GlassCard className="p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: `${sensor.color}18`, border: `1px solid ${sensor.color}35` }}>
            <Icon size={13} color={sensor.color} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">{sensor.label}</p>
            <p className="text-[10px]" style={{ color: '#8892a4' }}>Sensor stream</p>
          </div>
        </div>
        <StatusBadge status={status} showDot={true} />
      </div>

      {/* Current reading */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold mono text-white">{latest.toFixed(1)}</span>
        <span className="text-sm" style={{ color: '#8892a4' }}>{sensor.unit}</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md"
          style={{ background: `${statusColor}15`, color: statusColor }}>
          {isDanger ? '⚠ ALERT' : isWarning ? '△ WARNING' : '✓ NORMAL'}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <filter id={`glow-${sensor.key}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="t" hide />
          <YAxis tick={{ fontSize: 9, fill: '#8892a4' }} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          {sensor.warningHigh && (
            <ReferenceLine y={sensor.warningHigh} stroke="#ffb300" strokeDasharray="4 4" strokeWidth={1} />
          )}
          {sensor.dangerHigh && (
            <ReferenceLine y={sensor.dangerHigh} stroke="#ff4444" strokeDasharray="4 4" strokeWidth={1} />
          )}
          <Line
            type="monotone" dataKey={sensor.key} name={sensor.unit}
            stroke={sensor.color} strokeWidth={1.5} dot={false}
            activeDot={{ r: 3, fill: sensor.color }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Thresholds legend */}
      <div className="flex items-center gap-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8892a4' }}>
          <span className="inline-block w-4 h-px border-t border-dashed" style={{ borderColor: '#ffb300' }} />
          Warning: {sensor.warningHigh} {sensor.unit}
        </span>
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8892a4' }}>
          <span className="inline-block w-4 h-px border-t border-dashed" style={{ borderColor: '#ff4444' }} />
          Danger: {sensor.dangerHigh} {sensor.unit}
        </span>
      </div>
    </GlassCard>
  )
}

/* ── Outlier flags panel ──────────────────────────────── */
const OUTLIER_LABELS = ['Air Temp', 'Process Temp', 'RPM', 'Torque', 'Tool Wear']

export default function LiveSensors() {
  const [history, setHistory] = useState(() => {
    const now = Date.now()
    return Array.from({ length: MAX_POINTS }, (_, i) => {
      const obj = { t: i }
      SENSORS.forEach(s => { obj[s.key] = generatePoint(s) })
      return obj
    })
  })
  const [outliers, setOutliers] = useState([false, false, false, false, false])
  const [toolWear, setToolWear] = useState(134)

  const tick = useCallback(() => {
    setHistory(prev => {
      const last = prev[prev.length - 1]
      const next = { t: last.t + 1 }
      SENSORS.forEach(s => { next[s.key] = generatePoint(s, last[s.key]) })
      return [...prev.slice(-MAX_POINTS + 1), next]
    })
    setOutliers(OUTLIER_LABELS.map(() => Math.random() < 0.08))
    setToolWear(w => Math.min(250, w + Math.random() * 0.4))
  }, [])

  useEffect(() => {
    const iv = setInterval(tick, 800)
    return () => clearInterval(iv)
  }, [tick])

  const anomalyScore = outliers.filter(Boolean).length * 20

  return (
    <div className="page-enter space-y-5">
      {/* Top strip */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Live Sensor Streams</h2>
          <p className="text-xs" style={{ color: '#8892a4' }}>Updating every 800 ms · Machine ID: M-7823</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs">
            <span className="status-dot live" />
            <span className="text-white font-medium">Streaming</span>
          </div>
          <div className="glass px-3 py-1.5 rounded-lg text-xs">
            <span style={{ color: '#8892a4' }}>Tool Wear: </span>
            <span className="mono font-semibold" style={{ color: toolWear > 200 ? '#ff4444' : toolWear > 150 ? '#ffb300' : '#00ff88' }}>
              {toolWear.toFixed(0)} min
            </span>
          </div>
        </div>
      </div>

      {/* 4 charts grid */}
      <div className="grid grid-cols-2 gap-4">
        {SENSORS.map(s => (
          <SensorChart key={s.key} sensor={s} data={history} />
        ))}
      </div>

      {/* Outlier flags + anomaly */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Outlier Flags</p>
          <div className="space-y-2">
            {OUTLIER_LABELS.map((label, i) => (
              <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs" style={{ color: '#8892a4' }}>{label}</span>
                <div className="flex items-center gap-2">
                  {outliers[i]
                    ? <><AlertTriangle size={12} color="#ff4444" /><span className="text-xs font-medium" style={{ color: '#ff4444' }}>OUTLIER</span></>
                    : <><CheckCircle size={12} color="#00ff88" /><span className="text-xs font-medium" style={{ color: '#00ff88' }}>NORMAL</span></>
                  }
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-white uppercase tracking-wider">Total Anomaly Score</p>
          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={anomalyScore > 60 ? '#ff4444' : anomalyScore > 30 ? '#ffb300' : '#00ff88'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - anomalyScore / 100)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold mono text-white">{anomalyScore}</span>
                <span className="text-[10px]" style={{ color: '#8892a4' }}>/ 100</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <StatusBadge
              status={anomalyScore > 60 ? 'danger' : anomalyScore > 30 ? 'warning' : 'healthy'}
              label={anomalyScore > 60 ? 'High Anomaly' : anomalyScore > 30 ? 'Moderate Anomaly' : 'Nominal'}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
