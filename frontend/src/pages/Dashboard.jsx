import { useState, useEffect, useRef, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import {
  Cpu, Bell, AlertTriangle, BarChart2, ChevronLeft, ChevronRight,
  Clock, Wrench, Zap, ThermometerSun, Gauge, Activity,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import {
  generateSensorHistory,
  driftSensorPoint,
  INITIAL_MACHINES,
  generateRecentPredictions,
  clamp,
} from '../data/mockData'

/* ════════════════════════════════════════════════
   CONSTANTS & CONFIG
   ════════════════════════════════════════════════ */
const PAGE_SIZE = 5

export const CHART_TIME_RANGES = [
  { id: '1H',  label: '1H',  points: 60, sub: '60 min (live 3s)' },
  { id: '6H',  label: '6H',  points: 36, sub: '6 hours (10m res)' },
  { id: '24H', label: '24H', points: 24, sub: '24 hours (1h res)' },
  { id: '7D',  label: '7D',  points: 28, sub: '7 days (6h res)' },
]

export function generateDashboardHistory(range = '1H') {
  if (range === '1H') return generateSensorHistory(60)
  const rangeConfig = CHART_TIME_RANGES.find(r => r.id === range) || CHART_TIME_RANGES[0]
  const count = rangeConfig.points
  const now = Date.now()
  const stepMs = range === '6H' ? 10 * 60 * 1000 : range === '24H' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000

  return Array.from({ length: count }, (_, i) => {
    const tStamp = new Date(now - (count - 1 - i) * stepMs)
    let timeStr = ''
    if (range === '6H' || range === '24H') {
      timeStr = tStamp.toTimeString().slice(0, 5)
    } else {
      timeStr = `${tStamp.getMonth() + 1}/${tStamp.getDate()}`
    }

    const air = clamp(298 + Math.sin(i / 3) * 3 + (Math.random() - 0.5) * 1.5, 295, 305)
    const proc = clamp(air + 9.5 + Math.cos(i / 3) * 1.5 + (Math.random() - 0.5) * 0.8, 308, 313)
    const torq = clamp(48 + Math.sin(i / 2) * 8 + (Math.random() - 0.5) * 4, 35, 65)
    const spd = clamp(Math.round(1800 + Math.cos(i / 2) * 400 + (Math.random() - 0.5) * 100), 1200, 2800)
    const wear = clamp(Math.round((i / count) * 140 + (Math.random() - 0.5) * 10), 10, 190)

    return {
      index: i + 1,
      time: timeStr,
      airTemp: +air.toFixed(1),
      procTemp: +proc.toFixed(1),
      torque: +torq.toFixed(1),
      speed: spd,
      toolWear: wear,
      tempDelta: +(proc - air).toFixed(1),
      speedScaled: +(spd / 40).toFixed(1),
      toolWearScaled: +(wear / 2).toFixed(1),
    }
  })
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

/* ── Miniature sparkline (pure SVG, no recharts) ── */
function Sparkline({ data, color }) {
  const W = 80, H = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Last point dot */}
      {(() => {
        const last = data[data.length - 1]
        const x = W
        const y = H - ((last - min) / range) * (H - 4) - 2
        return <circle cx={x} cy={y} r={2.5} fill={color} />
      })()}
    </svg>
  )
}

/* ── KPI card ───────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, accentColor, animationType, description }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  return (
    <div
      className="glass glass-hover relative overflow-hidden p-5 flex flex-col gap-3"
      style={{
        borderLeft: `2px solid ${accentColor}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        boxShadow: animationType === 'glow-amber'
          ? `0 0 0 1px ${accentColor}25, 0 4px 32px rgba(0,0,0,0.4)`
          : undefined,
      }}
    >
      {/* Animated border for amber */}
      {animationType === 'glow-amber' && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ animation: 'amberGlow 2.5s ease infinite', border: `1px solid ${accentColor}` }} />
      )}

      {/* Icon + label row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>{label}</p>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
          {animationType === 'pulse-blue'
            ? <div style={{ animation: 'pulsate 2s ease infinite' }}><Icon size={16} color={accentColor} /></div>
            : <Icon size={16} color={accentColor} />
          }
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold mono leading-none text-white">{value}</span>
        {/* Red blinking dot for "failures" card */}
        {animationType === 'red-dot' && (
          <span className="mb-1 w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: accentColor, animation: 'warnBlink 0.9s ease infinite' }} />
        )}
      </div>

      {/* Description */}
      {description && <p className="text-[11px]" style={{ color: '#8892a4' }}>{description}</p>}
    </div>
  )
}

/* ── Machine status row ─────────────────────────── */
function MachineRow({ machine, delay = 0 }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t) }, [delay])

  const sparkColor = machine.status === 'critical' ? '#ff4444' : machine.status === 'warning' ? '#ffb300' : '#00ff88'

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
      style={{
        background: show ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: `1px solid ${machine.status === 'critical' ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
        opacity: show ? 1 : 0,
        transform: show ? 'translateX(0)' : 'translateX(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.2s',
      }}
    >
      {/* ID + type */}
      <div className="flex items-center gap-3 min-w-[100px]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
          style={{
            background: sparkColor + '18',
            color: sparkColor,
            border: `1px solid ${sparkColor}30`,
          }}>
          {machine.type}
        </div>
        <span className="text-sm font-semibold mono text-white">{machine.id}</span>
      </div>

      {/* Status badge — critical blinks */}
      <div className="flex items-center">
        {machine.status === 'critical' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4444', animation: 'warnBlink 0.8s ease infinite' }} />
            Critical
          </span>
        ) : machine.status === 'warning' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(255,179,0,0.12)', border: '1px solid rgba(255,179,0,0.3)', color: '#ffb300' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ffb300', animation: 'warnBlink 1.5s ease infinite' }} />
            Warning
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
            <span className="status-dot live" style={{ width: 6, height: 6 }} />
            Normal
          </span>
        )}
      </div>

      {/* Sparkline */}
      <Sparkline data={machine.readings} color={sparkColor} />
    </div>
  )
}

/* ── Chart tooltip ──────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const dataItem = payload[0]?.payload
  return (
    <div className="glass px-3 py-2.5 text-xs min-w-[190px] space-y-1">
      <div className="flex items-center justify-between border-b pb-1 mb-1.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="font-semibold text-white">Point #{dataItem?.t}</p>
        <span className="text-[10px] mono" style={{ color: '#8892a4' }}>{dataItem?.time}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: '#00d4ff' }}>Air Temp:</span>
        <span className="font-semibold mono text-white">{dataItem?.['Air Temp (K)']} K</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: '#c084fc' }}>Process Temp:</span>
        <span className="font-semibold mono text-white">{dataItem?.['Proc Temp (K)']} K</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: '#ffb300' }}>Torque:</span>
        <span className="font-semibold mono text-white">{dataItem?.['Torque (Nm)']} Nm</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: '#00ff88' }}>Speed:</span>
        <span className="font-semibold mono text-white">{dataItem?.rawSpeed} RPM</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: '#ff4444' }}>Tool Wear:</span>
        <span className="font-semibold mono text-white">{dataItem?.rawWear} min</span>
      </div>
    </div>
  )
}

/* ── Risk row styling ───────────────────────────── */
const RISK_META = {
  Critical: { color: '#ff4444', bg: 'rgba(255,68,68,0.07)',  border: 'rgba(255,68,68,0.15)'  },
  High:     { color: '#ff4444', bg: 'rgba(255,68,68,0.04)',  border: 'rgba(255,68,68,0.10)'  },
  Warning:  { color: '#ffb300', bg: 'rgba(255,179,0,0.05)', border: 'rgba(255,179,0,0.12)' },
  Medium:   { color: '#ffb300', bg: 'rgba(255,179,0,0.05)', border: 'rgba(255,179,0,0.12)' },
  Normal:   { color: '#00ff88', bg: 'rgba(0,255,136,0.03)', border: 'rgba(0,255,136,0.08)' },
  Low:      { color: '#00ff88', bg: 'rgba(0,255,136,0.03)', border: 'rgba(0,255,136,0.08)' },
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export default function Dashboard() {
  const [chartRange, setChartRange] = useState('1H')
  const [sensorData, setSensorData] = useState(() => generateSensorHistory(60))
  const [machines, setMachines] = useState(INITIAL_MACHINES)
  const [predictions] = useState(generateRecentPredictions)
  const [page, setPage] = useState(0)

  /* Table sorting state (Ascending/Descending toggle on column header click) */
  const [sortCol, setSortCol] = useState('time')
  const [sortAsc, setSortAsc] = useState(false)

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortAsc(a => !a)
    } else {
      setSortCol(colKey)
      setSortAsc(colKey === 'id' || colKey === 'action')
    }
  }

  /* ── Performance Optimization: Memoize Sorted Predictions ── */
  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => {
      let diff = 0
      if (sortCol === 'prob') {
        diff = a.prob - b.prob
      } else if (sortCol === 'id') {
        diff = a.id.localeCompare(b.id)
      } else if (sortCol === 'status') {
        const rank = { Critical: 3, High: 3, Warning: 2, Medium: 2, Normal: 1, Low: 1 }
        diff = (rank[a.status] || 0) - (rank[b.status] || 0)
      } else if (sortCol === 'action') {
        diff = (a.action || '').localeCompare(b.action || '')
      } else {
        diff = (a.time || '').localeCompare(b.time || '')
      }
      return sortAsc ? diff : -diff
    })
  }, [predictions, sortCol, sortAsc])

  const totalPages = Math.ceil(sortedPredictions.length / PAGE_SIZE)
  const pageData = sortedPredictions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  /* Time range switch handler: 1H / 6H / 24H / 7D */
  const handleRangeChange = (rId) => {
    setChartRange(rId)
    setSensorData(generateDashboardHistory(rId))
  }

  /* Live sensor tick every 3s */
  useEffect(() => {
    const iv = setInterval(() => {
      if (chartRange === '1H') {
        setSensorData(prev => {
          const last = prev[prev.length - 1]
          const next = driftSensorPoint(last, last.index + 1)
          return [...prev.slice(1), next]
        })
      }

      // Slightly drift machine sparkline readings every 3s
      setMachines(prev => prev.map(m => {
        const lastR = m.readings[m.readings.length - 1]
        const noise = (Math.random() - 0.5) * 3
        const newR = Math.max(8, Math.min(99, Math.round(lastR + noise)))
        return {
          ...m,
          readings: [...m.readings.slice(1), newR],
        }
      }))
    }, 3000)
    return () => clearInterval(iv)
  }, [chartRange])

  /* ── Performance Optimization: Memoize Chart Dataset ── */
  const chartData = useMemo(() => {
    return sensorData.map(d => ({
      t: d.time || d.index,
      time: d.time,
      'Air Temp (K)':       d.airTemp,
      'Proc Temp (K)':      d.procTemp,
      'Torque (Nm)':        d.torque,
      'Speed (÷40)':        d.speedScaled,
      'Tool Wear (min)':    d.toolWear,
      rawSpeed:             d.speed,
      rawWear:              d.toolWear,
    }))
  }, [sensorData])

  /* ── Performance Optimization: Memoize Machine Counts ── */
  const { critCount, warnCount, normCount } = useMemo(() => {
    let crit = 0, warn = 0, norm = 0
    for (const m of machines) {
      if (m.status === 'critical') crit++
      else if (m.status === 'warning') warn++
      else norm++
    }
    return { critCount: crit, warnCount: warn, normCount: norm }
  }, [machines])

  return (
    <div className="page-enter space-y-5">

      {/* ══ SECTION 1 — KPI CARDS (Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols) ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Machines Monitored"
          value={247}
          icon={Cpu}
          accentColor="#00d4ff"
          animationType="pulse-blue"
          description="Across 3 production lines"
        />
        <KpiCard
          label="Active Alerts"
          value={3}
          icon={Bell}
          accentColor="#ffb300"
          animationType="glow-amber"
          description="1 critical · 2 warning"
        />
        <KpiCard
          label="Predicted Failures Today"
          value={2}
          icon={AlertTriangle}
          accentColor="#ff4444"
          animationType="red-dot"
          description="Requires immediate attention"
        />
        <KpiCard
          label="Model Accuracy (Macro F1)"
          value="0.87"
          icon={BarChart2}
          accentColor="#00ff88"
          animationType="static"
          description="LightGBM · Target: ≥0.85"
        />
      </div>

      {/* ══ SECTION 2 — SENSOR CHART + MACHINE LIST (Mobile/Tablet: 1 col, Desktop: 7/5 split) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Real-time sensor chart */}
        <GlassCard className="col-span-1 lg:col-span-7 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-white">Real-Time Sensor Monitor ({chartRange})</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>
                {chartRange === '1H' ? 'Last 60 readings · live 3s updates' : `${CHART_TIME_RANGES.find(r => r.id === chartRange)?.sub}`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Time range buttons: 1H / 6H / 24H / 7D */}
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {CHART_TIME_RANGES.map(tr => {
                  const active = chartRange === tr.id
                  return (
                    <button
                      key={tr.id}
                      onClick={() => handleRangeChange(tr.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: active ? 'linear-gradient(135deg, rgba(0,212,255,0.28) 0%, rgba(0,180,255,0.18) 100%)' : 'transparent',
                        border: `1px solid ${active ? 'rgba(0,212,255,0.45)' : 'transparent'}`,
                        color: active ? '#00d4ff' : '#8892a4',
                        boxShadow: active ? '0 0 10px rgba(0,212,255,0.25)' : 'none',
                      }}
                      title={tr.sub}
                    >
                      {tr.label}
                    </button>
                  )
                })}
              </div>

              {chartRange === '1H' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <span className="status-dot live" />
                  <span className="text-xs font-medium" style={{ color: '#00ff88' }}>Live 3s</span>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {[
              { key: 'Air Temp (K)',    color: '#00d4ff', icon: ThermometerSun },
              { key: 'Proc Temp (K)',   color: '#c084fc', icon: ThermometerSun },
              { key: 'Torque (Nm)',     color: '#ffb300', icon: Zap            },
              { key: 'Speed (÷40)',     color: '#00ff88', icon: Gauge           },
              { key: 'Tool Wear (min)', color: '#ff4444', icon: Wrench         },
            ].map(({ key, color, icon: Icon }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded-full" style={{ background: color }} />
                <Icon size={11} color={color} />
                <span className="text-[11px]" style={{ color: '#8892a4' }}>{key}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                {[
                  ['blueGlow',   '#00d4ff'],
                  ['purpleGlow', '#c084fc'],
                  ['amberGlow',  '#ffb300'],
                  ['redGlow',    '#ff4444'],
                  ['greenGlow',  '#00ff88'],
                ].map(([id, color]) => (
                  <filter key={id} id={id}>
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8892a4' }} interval={9} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8892a4' }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="Air Temp (K)"     stroke="#00d4ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Proc Temp (K)"    stroke="#c084fc" strokeWidth={1.8} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Torque (Nm)"      stroke="#ffb300" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Speed (÷40)"      stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Tool Wear (min)"  stroke="#ff4444" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Machine status list (Mobile/Tablet: 1 col, Desktop: 5 cols) */}
        <GlassCard className="col-span-1 lg:col-span-5 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Machine Status</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>6 machines · IDs L-001 to H-006</p>
            </div>
            <div className="flex gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)' }}>{critCount} Crit</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(255,179,0,0.15)', color: '#ffb300', border: '1px solid rgba(255,179,0,0.3)' }}>{warnCount} Warn</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>{normCount} OK</span>
            </div>
          </div>
          <div className="space-y-2">
            {machines.map((m, i) => (
              <MachineRow key={m.id} machine={m} delay={i * 80} />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ══ SECTION 3 — PREDICTIONS TABLE ══ */}
      <GlassCard className="overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-semibold text-white">Latest Predictions</p>
            <p className="text-xs" style={{ color: '#8892a4' }}>10 recent predictions · mix of Normal/Warning/Critical</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Risk legend */}
            {[['Critical', '#ff4444'], ['Warning', '#ffb300'], ['Normal', '#00ff88']].map(([k, c]) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                style={{ background: `${c}15`, border: `1px solid ${c}30`, color: c }}>
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Scrollable container for mobile responsiveness */}
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Column headers with interactive sorting */}
            <div className="grid grid-cols-12 px-6 py-2.5 text-[10px] uppercase tracking-widest"
          style={{ color: '#8892a4', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { key: 'id', label: 'Machine ID', span: 'col-span-2' },
            { key: 'time', label: 'Timestamp', span: 'col-span-2' },
            { key: 'prob', label: 'Failure Prob.', span: 'col-span-2' },
            { key: 'status', label: 'Status', span: 'col-span-2' },
            { key: 'action', label: 'Action Recommended', span: 'col-span-4' },
          ].map(col => {
            const isSorted = sortCol === col.key
            return (
              <button
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`${col.span} flex items-center gap-1.5 text-left transition-colors hover:text-white group py-0.5`}
                style={{ color: isSorted ? '#00d4ff' : undefined }}
                title={`Sort by ${col.label} (${isSorted ? (sortAsc ? 'Ascending' : 'Descending') : 'Click to sort'})`}
              >
                <span className="font-semibold">{col.label}</span>
                {isSorted ? (
                  sortAsc ? <ArrowUp size={11} className="text-cyan-400 shrink-0" /> : <ArrowDown size={11} className="text-cyan-400 shrink-0" />
                ) : (
                  <ArrowUpDown size={10} className="opacity-30 group-hover:opacity-80 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.03)' }}>
          {pageData.map((row, i) => {
            const meta = RISK_META[row.status] || RISK_META.Normal
            return (
              <div
                key={row.id + row.time + i}
                className="grid grid-cols-12 items-center px-6 py-3.5 transition-colors"
                style={{
                  background: meta.bg,
                  borderLeft: `2px solid ${meta.color}40`,
                  animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
                }}
              >
                {/* Machine ID */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xs font-bold mono text-white">{row.id}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#8892a4' }}>{row.type}</span>
                </div>

                {/* Timestamp */}
                <span className="col-span-2 flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
                  <Clock size={11} />
                  {row.time}
                </span>

                {/* Probability bar + value */}
                <span className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${row.prob * 100}%`, background: meta.color }} />
                    </div>
                    <span className="text-xs mono font-semibold" style={{ color: meta.color }}>
                      {(row.prob * 100).toFixed(0)}%
                    </span>
                  </div>
                </span>

                {/* Risk badge */}
                <span className="col-span-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                    {row.status === 'Critical' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color, animation: 'warnBlink 0.9s ease infinite' }} />}
                    {row.status === 'Warning' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color, animation: 'warnBlink 1.5s ease infinite' }} />}
                    {row.status === 'Normal' && <span className="status-dot live" style={{ width: 6, height: 6 }} />}
                    {row.status}
                  </span>
                </span>

                {/* Action */}
                <span className="col-span-4 text-xs truncate" style={{ color: '#c8d3e0' }}>{row.action}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#8892a4' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, predictions.length)} of {predictions.length} predictions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronLeft size={14} color="#8892a4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: page === i ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${page === i ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: page === i ? '#00d4ff' : '#8892a4',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronRight size={14} color="#8892a4" />
            </button>
          </div>
        </div>
      </GlassCard>

    </div>
  )
}
