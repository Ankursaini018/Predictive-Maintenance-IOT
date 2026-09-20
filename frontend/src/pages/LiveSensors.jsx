import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Wifi, WifiOff, Download, ZoomIn, ZoomOut, RefreshCw,
  ChevronDown, AlertTriangle, Thermometer, Wind, Gauge,
  Zap, Wrench,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'

/* ════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════ */
const MACHINES = Array.from({ length: 10 }, (_, i) => `L-${String(i + 1).padStart(3, '0')}`)

const REFRESH_RATES = [
  { label: '1s',  ms: 1000 },
  { label: '5s',  ms: 5000 },
  { label: '10s', ms: 10000 },
]

const SENSORS = {
  airTemp:  { key: 'airTemp',  label: 'Air Temperature',     unit: 'K',   color: '#00d4ff', icon: Thermometer, min: 295, max: 305, warnAt: 302, dangerAt: 304, baseVal: 300 },
  procTemp: { key: 'procTemp', label: 'Process Temperature', unit: 'K',   color: '#c084fc', icon: Wind,        min: 305, max: 315, warnAt: 312, dangerAt: 314, baseVal: 310 },
  rpm:      { key: 'rpm',      label: 'Rotational Speed',    unit: 'RPM', color: '#00ff88', icon: Gauge,       min: 1000, max: 3000, warnAt: 2400, dangerAt: 2700, baseVal: 1500 },
  torque:   { key: 'torque',   label: 'Torque',              unit: 'Nm',  color: '#ffb300', icon: Zap,         min: 0, max: 80, warnAt: 55, dangerAt: 68, baseVal: 40 },
  toolWear: { key: 'toolWear', label: 'Tool Wear',           unit: 'min', color: '#ff4444', icon: Wrench,      min: 0, max: 250, warnAt: 175, dangerAt: 210, baseVal: 80 },
}

const MAX_HISTORY = 60

/* ════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════ */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function sensorColor(s, v) {
  if (v >= s.dangerAt) return '#ff4444'
  if (v >= s.warnAt)   return '#ffb300'
  return s.color
}

function sensorStatus(s, v) {
  if (v >= s.dangerAt) return 'danger'
  if (v >= s.warnAt)   return 'warning'
  return 'normal'
}

function normalize(v, min, max) { return Math.max(0, Math.min(1, (v - min) / (max - min))) }

function nextVal(s, prev) {
  const speed = s.key === 'rpm' ? 60 : s.key === 'toolWear' ? 0.3 : 0.4
  const noise = (s.max - s.min) * 0.025
  let v = prev + (Math.random() - 0.5) * noise * 2
  if (s.key === 'toolWear') v += speed * Math.random()
  return clamp(v, s.min, s.max)
}

function makeInitialState() {
  return Object.fromEntries(Object.values(SENSORS).map(s => [s.key, s.baseVal + (Math.random() - 0.5) * (s.max - s.min) * 0.1]))
}

function makeInitialHistory(current) {
  return Array.from({ length: MAX_HISTORY }, (_, i) => {
    const t = -(MAX_HISTORY - 1 - i)
    return {
      t,
      ...Object.fromEntries(Object.values(SENSORS).map(s => [s.key, clamp(current[s.key] + (Math.random() - 0.5) * (s.max - s.min) * 0.08, s.min, s.max)]))
    }
  })
}

/* ════════════════════════════════════════════════
   SVG CIRCULAR GAUGE (Speedometer)
   ════════════════════════════════════════════════ */
function CircularGauge({ sensor, value, size = 180 }) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.38
  // Arc from 215° to 325° = 270° sweep (bottom-left to bottom-right, opening downward)
  const startAngle = 215
  const endAngle   = 325
  const sweepDeg   = (endAngle - startAngle + 360) % 360  // = 270 (going clockwise avoiding the gap)
  // Actually: 215 → 360 → 325 anticlockwise is complex. Let's use standard: start at 135°, end at 45° going clockwise = 270° sweep
  // startAngle = 135 (bottom-left), endAngle = 45 (top-right)... 
  // Let's keep it simple: 220 → 500 (= 220 to 140 going clockwise 280°)
  const SA = 220, sweepTotal = 280
  const norm = normalize(value, sensor.min, sensor.max)
  const color = sensorColor(sensor, value)

  function polarToXY(angleDeg, radius) {
    const rad = (angleDeg - 90) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function describeArc(start, sweep, radius) {
    const end = start + sweep
    const p1 = polarToXY(start, radius)
    const p2 = polarToXY(end, radius)
    const large = sweep > 180 ? 1 : 0
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`
  }

  const fillSweep = norm * sweepTotal

  // Tick marks
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const a = SA + (i / 8) * sweepTotal
    const p1 = polarToXY(a, r - 4)
    const p2 = polarToXY(a, r - (i % 2 === 0 ? 12 : 8))
    return { p1, p2, major: i % 2 === 0 }
  })

  // Needle
  const needleAngle = SA + norm * sweepTotal
  const needleTip = polarToXY(needleAngle, r - 18)
  const needleBase1 = polarToXY(needleAngle + 90, 5)
  const needleBase2 = polarToXY(needleAngle - 90, 5)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path d={describeArc(SA, sweepTotal, r)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />

        {/* Color zones (green/amber/red) */}
        <path d={describeArc(SA, sweepTotal * normalize(sensor.warnAt, sensor.min, sensor.max), r)}
          fill="none" stroke={`${sensor.color}40`} strokeWidth="10" strokeLinecap="round" />

        {/* Fill arc */}
        <path d={describeArc(SA, fillSweep, r)} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: 'stroke-dasharray 0.4s ease, stroke 0.5s ease' }} />

        {/* Ticks */}
        {ticks.map((tk, i) => (
          <line key={i} x1={tk.p1.x} y1={tk.p1.y} x2={tk.p2.x} y2={tk.p2.y}
            stroke={tk.major ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={tk.major ? 1.5 : 1} />
        ))}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <circle cx={cx} cy={cy} r={6} fill="#1a2540" stroke={color} strokeWidth="2" />

        {/* Min/Max labels */}
        {(() => {
          const minP = polarToXY(SA, r + 14)
          const maxP = polarToXY(SA + sweepTotal, r + 14)
          return <>
            <text x={minP.x} y={minP.y} textAnchor="middle" fontSize="9" fill="#8892a4">{sensor.min}</text>
            <text x={maxP.x} y={maxP.y} textAnchor="middle" fontSize="9" fill="#8892a4">{sensor.max}</text>
          </>
        })()}
      </svg>

      {/* Center value */}
      <div className="absolute flex flex-col items-center" style={{ bottom: size * 0.15 }}>
        <span className="text-2xl font-bold mono leading-none" style={{ color, transition: 'color 0.5s ease' }}>
          {value.toFixed(1)}
        </span>
        <span className="text-[11px] mt-0.5" style={{ color: '#8892a4' }}>{sensor.unit}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   VERTICAL BAR GAUGE (RPM)
   ════════════════════════════════════════════════ */
function VerticalBarGauge({ sensor, value }) {
  const norm = normalize(value, sensor.min, sensor.max)
  const color = sensorColor(sensor, value)
  const segments = 20

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex gap-2 items-end" style={{ height: 160 }}>
        {/* Segmented bar */}
        <div className="flex flex-col-reverse gap-0.5" style={{ height: 160, justifyContent: 'flex-start' }}>
          {Array.from({ length: segments }, (_, i) => {
            const threshold = i / segments
            const active = norm > threshold
            const segColor = threshold >= normalize(sensor.dangerAt, sensor.min, sensor.max)
              ? '#ff4444' : threshold >= normalize(sensor.warnAt, sensor.min, sensor.max) ? '#ffb300' : sensor.color
            return (
              <div key={i}
                className="rounded-sm transition-all"
                style={{
                  width: 28,
                  height: `${100 / segments - 1}%`,
                  background: active ? segColor : 'rgba(255,255,255,0.06)',
                  boxShadow: active ? `0 0 4px ${segColor}60` : 'none',
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                }}
              />
            )
          })}
        </div>
        {/* Scale labels */}
        <div className="flex flex-col justify-between text-[9px] pb-0.5" style={{ height: 160, color: '#8892a4' }}>
          <span>{sensor.max}</span>
          <span>{Math.round((sensor.max + sensor.min) / 2)}</span>
          <span>{sensor.min}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold mono" style={{ color, transition: 'color 0.5s ease' }}>{Math.round(value)}</p>
        <p className="text-xs" style={{ color: '#8892a4' }}>{sensor.unit}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   HORIZONTAL BAR GAUGE (Torque)
   ════════════════════════════════════════════════ */
function HorizontalBarGauge({ sensor, value }) {
  const norm = normalize(value, sensor.min, sensor.max)
  const warnNorm = normalize(sensor.warnAt, sensor.min, sensor.max)
  const dangerNorm = normalize(sensor.dangerAt, sensor.min, sensor.max)
  const color = sensorColor(sensor, value)

  return (
    <div className="flex flex-col gap-4 py-2 w-full">
      {/* Big value display */}
      <div className="flex items-baseline gap-2 justify-center">
        <span className="text-5xl font-bold mono" style={{ color, transition: 'color 0.5s ease' }}>{value.toFixed(1)}</span>
        <span className="text-base" style={{ color: '#8892a4' }}>{sensor.unit}</span>
      </div>

      {/* Horizontal bar */}
      <div className="relative w-full">
        {/* Zone track */}
        <div className="flex rounded-full overflow-hidden h-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ width: `${warnNorm * 100}%`, background: `${sensor.color}80` }} className="rounded-l-full" />
          <div style={{ width: `${(dangerNorm - warnNorm) * 100}%`, background: 'rgba(255,179,0,0.6)' }} />
          <div style={{ flex: 1, background: 'rgba(255,68,68,0.6)' }} className="rounded-r-full" />
        </div>
        {/* Fill overlay */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${norm * 100}%`,
              background: `linear-gradient(90deg, ${sensor.color}, ${color})`,
              boxShadow: `0 0 12px ${color}60`,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        {/* Marker line */}
        <div className="absolute top-0 h-full w-0.5 rounded-full"
          style={{ left: `${norm * 100}%`, background: '#fff', boxShadow: '0 0 6px white', transform: 'translateX(-50%)', transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>

      {/* Scale */}
      <div className="flex justify-between text-[10px]" style={{ color: '#8892a4' }}>
        <span>{sensor.min} {sensor.unit}</span>
        <span style={{ color: '#ffb300' }}>⚠ {sensor.warnAt}</span>
        <span style={{ color: '#ff4444' }}>⛔ {sensor.dangerAt}</span>
        <span>{sensor.max} {sensor.unit}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LINEAR PROGRESS (Tool Wear)
   ════════════════════════════════════════════════ */
function ToolWearGauge({ sensor, value }) {
  const norm = normalize(value, sensor.min, sensor.max)
  const pct = norm * 100
  const color = sensorColor(sensor, value)
  const status = sensorStatus(sensor, value)
  const replaceSoon = value >= sensor.warnAt

  return (
    <div className="flex flex-col gap-4 py-2 w-full">
      {/* Circular-style percentage display */}
      <div className="flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - norm)}
              style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-2xl font-bold mono" style={{ color, transition: 'color 0.5s ease' }}>{pct.toFixed(0)}%</span>
            <span className="text-[10px]" style={{ color: '#8892a4' }}>worn</span>
          </div>
        </div>
      </div>

      {/* Value + Replace warning */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold mono text-white">{value.toFixed(0)} / {sensor.max} min</p>
        {replaceSoon && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: `${color}15`, border: `1px solid ${color}35`, animation: status === 'danger' ? 'warnBlink 1s ease infinite' : undefined }}>
            <AlertTriangle size={12} color={color} />
            <span className="text-xs font-semibold" style={{ color }}>
              {status === 'danger' ? 'Replace Immediately!' : 'Replace Soon'}
            </span>
          </div>
        )}
      </div>

      {/* Segmented linear bar */}
      <div>
        <div className="flex gap-0.5 rounded-full overflow-hidden h-2.5">
          {Array.from({ length: 25 }, (_, i) => {
            const threshold = i / 25
            const active = norm > threshold
            const segColor = threshold >= normalize(sensor.dangerAt, sensor.min, sensor.max) ? '#ff4444' :
              threshold >= normalize(sensor.warnAt, sensor.min, sensor.max) ? '#ffb300' : sensor.color
            return <div key={i} className="flex-1 rounded-sm transition-all"
              style={{ background: active ? segColor : 'rgba(255,255,255,0.07)', transition: 'background 0.3s ease' }} />
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: '#8892a4' }}>
          <span>0</span><span style={{ color: '#ffb300' }}>70%</span><span style={{ color: '#ff4444' }}>84%</span><span>100%</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STATUS BADGE FOR SENSOR CARD HEADER
   ════════════════════════════════════════════════ */
function SensorStatusBadge({ value, sensor }) {
  const s = sensorStatus(sensor, value)
  const color = s === 'danger' ? '#ff4444' : s === 'warning' ? '#ffb300' : '#00ff88'
  const label = s === 'danger' ? 'ALERT' : s === 'warning' ? 'WARNING' : 'NORMAL'
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ background: color, animation: s !== 'normal' ? 'warnBlink 0.9s ease infinite' : 'livePulse 2s infinite' }} />
      {label}
    </span>
  )
}

/* ════════════════════════════════════════════════
   CHART TOOLTIP
   ════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="font-medium text-white mb-1.5">Reading {label}</p>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.dataKey} className="flex justify-between gap-5 mb-0.5">
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span className="mono font-semibold text-white">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   DROPDOWN
   ════════════════════════════════════════════════ */
function Dropdown({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d3e0', minWidth: 130 }}>
        <span className="flex-1 text-left">{label}: <span className="text-white font-semibold">{value}</span></span>
        <ChevronDown size={12} color="#8892a4" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 glass rounded-xl overflow-hidden shadow-2xl" style={{ minWidth: 150 }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false) }}
              className="w-full px-4 py-2 text-left text-xs transition-colors"
              style={{
                background: o === value ? 'rgba(0,212,255,0.12)' : 'transparent',
                color: o === value ? '#00d4ff' : '#c8d3e0',
              }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   EXPORT CSV
   ════════════════════════════════════════════════ */
function exportCSV(history) {
  const headers = ['reading', ...Object.values(SENSORS).map(s => `${s.label} (${s.unit})`)]
  const rows = history.map(h => [h.t, ...Object.values(SENSORS).map(s => h[s.key]?.toFixed(2) ?? '')])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `sensor_history_${Date.now()}.csv`; a.click()
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function LiveSensors() {
  const [machine, setMachine] = useState('L-001')
  const [refreshRate, setRefreshRate] = useState('1s')
  const [connected, setConnected] = useState(true)
  const [current, setCurrent] = useState(makeInitialState)
  const [history, setHistory] = useState(() => makeInitialHistory(makeInitialState()))
  const [visible, setVisible] = useState({ airTemp: true, procTemp: true, rpm: true, torque: true, toolWear: true })
  const [zoom, setZoom] = useState(60)       // how many points to show

  const refreshMs = REFRESH_RATES.find(r => r.label === refreshRate)?.ms || 1000

  /* Tick */
  const tick = useCallback(() => {
    setCurrent(prev => {
      const next = Object.fromEntries(Object.values(SENSORS).map(s => [s.key, nextVal(s, prev[s.key])]))
      setHistory(h => {
        const point = { t: h[h.length - 1].t + 1, ...next }
        return [...h.slice(-(MAX_HISTORY - 1)), point]
      })
      return next
    })
  }, [])

  useEffect(() => {
    const iv = setInterval(tick, refreshMs)
    return () => clearInterval(iv)
  }, [tick, refreshMs])

  /* Simulate disconnect on machine change */
  useEffect(() => {
    setConnected(false)
    const t = setTimeout(() => { setConnected(true); setCurrent(makeInitialState()); setHistory(makeInitialHistory(makeInitialState())) }, 800)
    return () => clearTimeout(t)
  }, [machine])

  const chartData = history.slice(-zoom)

  /* Normalise rpm & toolWear for chart co-display */
  const normalizedChart = chartData.map(h => ({
    t: h.t,
    airTemp:    h.airTemp,
    procTemp:   h.procTemp,
    torque:     h.torque,
    'rpm÷100':  visible.rpm      ? +(h.rpm / 100).toFixed(2) : undefined,
    'wear÷10':  visible.toolWear ? +(h.toolWear / 10).toFixed(2) : undefined,
  }))

  const airDelta = (current.procTemp - current.airTemp).toFixed(1)

  return (
    <div className="page-enter space-y-5">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Dropdown value={machine} options={MACHINES} onChange={m => setMachine(m)} label="Machine" />
          <Dropdown
            value={refreshRate}
            options={REFRESH_RATES.map(r => r.label)}
            onChange={r => setRefreshRate(r)}
            label="Refresh"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Timestamps */}
          <span className="text-xs mono" style={{ color: '#8892a4' }}>
            {new Date().toLocaleTimeString('en-IN', { hour12: false })}
          </span>
          {/* Connection */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: connected ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)', border: `1px solid ${connected ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)'}` }}>
            {connected
              ? <><span className="status-dot live" /><Wifi size={13} color="#00ff88" /><span className="text-xs font-medium" style={{ color: '#00ff88' }}>Connected</span></>
              : <><span className="status-dot danger" /><WifiOff size={13} color="#ff4444" /><span className="text-xs font-medium" style={{ color: '#ff4444' }}>Reconnecting…</span></>
            }
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs" style={{ color: '#8892a4' }}>
            <RefreshCw size={12} className={connected ? 'animate-spin' : ''} style={{ animationDuration: `${refreshMs}ms` }} />
            <span>{refreshRate}</span>
          </div>
        </div>
      </div>

      {/* ══ GAUGE CARDS 2-2-1 ══ */}
      {/* Row 1: Air Temp + Process Temp */}
      <div className="grid grid-cols-2 gap-4">

        {/* Card 1 — Air Temperature */}
        <GlassCard className="p-5" style={{ borderTop: `2px solid ${sensorColor(SENSORS.airTemp, current.airTemp)}40` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: `${SENSORS.airTemp.color}18`, border: `1px solid ${SENSORS.airTemp.color}30` }}>
                <Thermometer size={13} color={SENSORS.airTemp.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{SENSORS.airTemp.label}</p>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Range: {SENSORS.airTemp.min}–{SENSORS.airTemp.max} K</p>
              </div>
            </div>
            <SensorStatusBadge value={current.airTemp} sensor={SENSORS.airTemp} />
          </div>
          <div className="flex justify-center">
            <CircularGauge sensor={SENSORS.airTemp} value={current.airTemp} size={190} />
          </div>
        </GlassCard>

        {/* Card 2 — Process Temperature */}
        <GlassCard className="p-5" style={{ borderTop: `2px solid ${sensorColor(SENSORS.procTemp, current.procTemp)}40` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}>
                <Wind size={13} color="#c084fc" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{SENSORS.procTemp.label}</p>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Range: {SENSORS.procTemp.min}–{SENSORS.procTemp.max} K</p>
              </div>
            </div>
            <SensorStatusBadge value={current.procTemp} sensor={SENSORS.procTemp} />
          </div>
          <div className="flex justify-center">
            <CircularGauge sensor={SENSORS.procTemp} value={current.procTemp} size={190} />
          </div>
          {/* Delta badge */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.25)' }}>
              <span className="text-[11px]" style={{ color: '#8892a4' }}>Δ from Air Temp:</span>
              <span className="text-sm font-bold mono" style={{ color: '#c084fc' }}>+{airDelta} K</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: RPM + Torque */}
      <div className="grid grid-cols-2 gap-4">

        {/* Card 3 — Rotational Speed (vertical bar) */}
        <GlassCard className="p-5" style={{ borderTop: `2px solid ${sensorColor(SENSORS.rpm, current.rpm)}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: `${SENSORS.rpm.color}18`, border: `1px solid ${SENSORS.rpm.color}30` }}>
                <Gauge size={13} color={SENSORS.rpm.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{SENSORS.rpm.label}</p>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Range: {SENSORS.rpm.min}–{SENSORS.rpm.max} RPM</p>
              </div>
            </div>
            <SensorStatusBadge value={current.rpm} sensor={SENSORS.rpm} />
          </div>
          <div className="flex justify-center">
            <VerticalBarGauge sensor={SENSORS.rpm} value={current.rpm} />
          </div>
        </GlassCard>

        {/* Card 4 — Torque (horizontal bar) */}
        <GlassCard className="p-5" style={{ borderTop: `2px solid ${sensorColor(SENSORS.torque, current.torque)}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: `${SENSORS.torque.color}18`, border: `1px solid ${SENSORS.torque.color}30` }}>
                <Zap size={13} color={SENSORS.torque.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{SENSORS.torque.label}</p>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Range: {SENSORS.torque.min}–{SENSORS.torque.max} Nm</p>
              </div>
            </div>
            <SensorStatusBadge value={current.torque} sensor={SENSORS.torque} />
          </div>
          <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
            <HorizontalBarGauge sensor={SENSORS.torque} value={current.torque} />
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Tool Wear (centered, narrower) */}
      <div className="grid grid-cols-3 gap-4">
        <div />
        {/* Card 5 — Tool Wear */}
        <GlassCard className="p-5" style={{ borderTop: `2px solid ${sensorColor(SENSORS.toolWear, current.toolWear)}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: `${SENSORS.toolWear.color}18`, border: `1px solid ${SENSORS.toolWear.color}30` }}>
                <Wrench size={13} color={SENSORS.toolWear.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{SENSORS.toolWear.label}</p>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Range: 0–250 min</p>
              </div>
            </div>
            <SensorStatusBadge value={current.toolWear} sensor={SENSORS.toolWear} />
          </div>
          <ToolWearGauge sensor={SENSORS.toolWear} value={current.toolWear} />
        </GlassCard>
        <div />
      </div>

      {/* ══ HISTORY CHART ══ */}
      <GlassCard className="p-5">
        {/* Chart header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Sensor History</p>
            <p className="text-xs" style={{ color: '#8892a4' }}>Last {zoom} readings · {machine}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sensor toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.values(SENSORS).map(s => (
                <button key={s.key}
                  onClick={() => setVisible(v => ({ ...v, [s.key]: !v[s.key] }))}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: visible[s.key] ? `${s.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${visible[s.key] ? `${s.color}40` : 'rgba(255,255,255,0.08)'}`,
                    color: visible[s.key] ? s.color : '#8892a4',
                    opacity: visible[s.key] ? 1 : 0.5,
                  }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: visible[s.key] ? s.color : '#8892a4' }} />
                  {s.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-white/10">
                <ZoomOut size={12} color="#8892a4" />
              </button>
              <span className="text-[11px] mono px-1" style={{ color: '#8892a4' }}>{zoom}pts</span>
              <button onClick={() => setZoom(z => Math.min(MAX_HISTORY, z + 10))} className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-white/10">
                <ZoomIn size={12} color="#8892a4" />
              </button>
            </div>

            {/* Export */}
            <button onClick={() => exportCSV(history)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
              <Download size={12} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Chart legend note */}
        <p className="text-[10px] mb-3" style={{ color: '#8892a4' }}>
          Note: RPM shown as ÷100 · Tool Wear shown as ÷10 for co-display scale
        </p>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={normalizedChart} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8892a4' }} interval={Math.floor(zoom / 8)} />
            <YAxis tick={{ fontSize: 10, fill: '#8892a4' }} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />

            {visible.airTemp  && <Line type="monotone" dataKey="airTemp"  name="Air Temp (K)"       stroke={SENSORS.airTemp.color}  strokeWidth={1.5} dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />}
            {visible.procTemp && <Line type="monotone" dataKey="procTemp" name="Proc Temp (K)"      stroke={SENSORS.procTemp.color} strokeWidth={1.5} dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />}
            {visible.torque   && <Line type="monotone" dataKey="torque"   name="Torque (Nm)"        stroke={SENSORS.torque.color}   strokeWidth={1.5} dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />}
            {visible.rpm      && <Line type="monotone" dataKey="rpm÷100"  name="Speed (RPM÷100)"    stroke={SENSORS.rpm.color}      strokeWidth={1.5} dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />}
            {visible.toolWear && <Line type="monotone" dataKey="wear÷10"  name="Tool Wear (min÷10)" stroke={SENSORS.toolWear.color} strokeWidth={1.5} dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />}
          </LineChart>
        </ResponsiveContainer>

        {/* Mini legend */}
        <div className="flex items-center gap-5 mt-3 flex-wrap">
          {Object.values(SENSORS).map(s => (
            visible[s.key] && (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded-full" style={{ background: s.color }} />
                <span className="text-[10px]" style={{ color: '#8892a4' }}>{s.label}</span>
              </div>
            )
          ))}
        </div>
      </GlassCard>

    </div>
  )
}
