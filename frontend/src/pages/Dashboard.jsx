import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import {
  Cpu, Bell, AlertTriangle, BarChart2, ChevronLeft, ChevronRight,
  Clock, Wrench, Zap, ThermometerSun, Gauge, Activity,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'

/* ════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════ */

/* ── 30-reading multi-line sensor history ───────── */
function makeSensorHistory() {
  return Array.from({ length: 30 }, (_, i) => ({
    t: i + 1,
    temperature: 298 + Math.sin(i / 4) * 4 + (Math.random() - 0.5) * 2,
    torque:       38  + Math.cos(i / 3) * 6 + (Math.random() - 0.5) * 3,
    toolWear:     80  + i * 1.8            + (Math.random() - 0.5) * 4,
    speed:        1450 + Math.sin(i / 5) * 80 + (Math.random() - 0.5) * 30,
  }))
}

/* ── Machine status list ─────────────────────────── */
const MACHINES = [
  { id: 'M-7823', type: 'M', status: 'critical', readings: [88, 92, 95, 97, 94, 98, 96, 99] },
  { id: 'H-5502', type: 'H', status: 'warning',  readings: [62, 65, 68, 71, 67, 73, 70, 74] },
  { id: 'L-3319', type: 'L', status: 'normal',   readings: [30, 28, 32, 29, 31, 27, 33, 30] },
  { id: 'H-1042', type: 'H', status: 'warning',  readings: [55, 58, 61, 57, 63, 60, 65, 62] },
  { id: 'M-0091', type: 'M', status: 'normal',   readings: [18, 21, 19, 22, 20, 18, 23, 21] },
  { id: 'L-7712', type: 'L', status: 'normal',   readings: [10, 12, 11, 13, 10, 12, 11, 10] },
]

/* ── Predictions table ─────────────────────────── */
const ALL_PREDICTIONS = [
  { id: 'M-7823', ts: '20:38:12', prob: 0.97, risk: 'Critical',  action: 'Immediate Shutdown & Inspection' },
  { id: 'H-5502', ts: '20:36:44', prob: 0.83, risk: 'High',      action: 'Schedule Maintenance within 2h'  },
  { id: 'H-1042', ts: '20:35:01', prob: 0.71, risk: 'High',      action: 'Increase Monitoring Frequency'  },
  { id: 'L-3319', ts: '20:33:29', prob: 0.58, risk: 'Medium',    action: 'Review Sensor Calibration'       },
  { id: 'M-5590', ts: '20:31:17', prob: 0.42, risk: 'Medium',    action: 'Log & Monitor'                  },
  { id: 'H-9988', ts: '20:29:05', prob: 0.31, risk: 'Low',       action: 'Routine Check Next Shift'        },
  { id: 'M-0091', ts: '20:27:53', prob: 0.14, risk: 'Low',       action: 'No Action Required'              },
  { id: 'L-7712', ts: '20:25:41', prob: 0.09, risk: 'Low',       action: 'No Action Required'              },
  { id: 'H-3301', ts: '20:23:30', prob: 0.22, risk: 'Low',       action: 'Log & Monitor'                  },
  { id: 'L-0014', ts: '20:21:18', prob: 0.06, risk: 'Low',       action: 'No Action Required'              },
]

const PAGE_SIZE = 5

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
  return (
    <div className="glass px-3 py-2.5 text-xs min-w-[160px]">
      <p className="font-semibold text-white mb-2">Reading #{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span className="font-semibold mono text-white">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Risk row styling ───────────────────────────── */
const RISK_META = {
  Critical: { color: '#ff4444', bg: 'rgba(255,68,68,0.07)',  border: 'rgba(255,68,68,0.15)'  },
  High:     { color: '#ff4444', bg: 'rgba(255,68,68,0.04)',  border: 'rgba(255,68,68,0.10)'  },
  Medium:   { color: '#ffb300', bg: 'rgba(255,179,0,0.05)', border: 'rgba(255,179,0,0.12)' },
  Low:      { color: '#00ff88', bg: 'rgba(0,255,136,0.03)', border: 'rgba(0,255,136,0.08)' },
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export default function Dashboard() {
  const [sensorData, setSensorData] = useState(makeSensorHistory)
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(ALL_PREDICTIONS.length / PAGE_SIZE)
  const pageData = ALL_PREDICTIONS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  /* Live sensor tick every 1.2s */
  useEffect(() => {
    const iv = setInterval(() => {
      setSensorData(prev => {
        const last = prev[prev.length - 1]
        const next = {
          t: last.t + 1,
          temperature: Math.max(294, Math.min(310, last.temperature + (Math.random() - 0.5) * 1.5)),
          torque:      Math.max(28,  Math.min(55,  last.torque      + (Math.random() - 0.5) * 2)),
          toolWear:    Math.min(250, last.toolWear + Math.random() * 0.6),
          speed:       Math.max(1300, Math.min(1700, last.speed     + (Math.random() - 0.5) * 25)),
        }
        return [...prev.slice(-29), next]
      })
    }, 1200)
    return () => clearInterval(iv)
  }, [])

  /* Normalise toolWear & speed for co-display on same Y axis */
  const chartData = sensorData.map(d => ({
    t: d.t,
    'Temp (K)':       +d.temperature.toFixed(1),
    'Torque (Nm)':    +d.torque.toFixed(1),
    'Tool Wear (÷10)':+(d.toolWear / 10).toFixed(1),
    'Speed (÷40)':    +(d.speed / 40).toFixed(1),
  }))

  return (
    <div className="page-enter space-y-5">

      {/* ══ SECTION 1 — KPI CARDS ══ */}
      <div className="grid grid-cols-4 gap-4">
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
          description="2 critical · 1 warning"
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
          value="0.9249"
          icon={BarChart2}
          accentColor="#00ff88"
          animationType="static"
          description="LightGBM · Stratified 5-Fold CV"
        />
      </div>

      {/* ══ SECTION 2 — SENSOR CHART + MACHINE LIST ══ */}
      <div className="grid grid-cols-12 gap-4">

        {/* Real-time sensor chart (60%) */}
        <GlassCard className="col-span-7 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Real-Time Sensor Monitor</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>Last 30 readings · updating every 1.2s</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot live" />
              <span className="text-xs font-medium" style={{ color: '#00ff88' }}>Live</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-3 flex-wrap">
            {[
              { key: 'Temp (K)',        color: '#00d4ff', icon: ThermometerSun },
              { key: 'Torque (Nm)',     color: '#ffb300', icon: Zap            },
              { key: 'Tool Wear (÷10)',  color: '#ff4444', icon: Wrench         },
              { key: 'Speed (÷40)',     color: '#00ff88', icon: Gauge           },
            ].map(({ key, color, icon: Icon }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 rounded-full" style={{ background: color }} />
                <Icon size={11} color={color} />
                <span className="text-[11px]" style={{ color: '#8892a4' }}>{key}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                {[
                  ['blueGlow',  '#00d4ff'],
                  ['amberGlow', '#ffb300'],
                  ['redGlow',   '#ff4444'],
                  ['greenGlow', '#00ff88'],
                ].map(([id, color]) => (
                  <filter key={id} id={id}>
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8892a4' }} interval={4} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8892a4' }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="Temp (K)"        stroke="#00d4ff" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, fill: '#00d4ff' }} />
              <Line type="monotone" dataKey="Torque (Nm)"     stroke="#ffb300" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, fill: '#ffb300' }} />
              <Line type="monotone" dataKey="Tool Wear (÷10)" stroke="#ff4444" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, fill: '#ff4444' }} />
              <Line type="monotone" dataKey="Speed (÷40)"     stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, fill: '#00ff88' }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Machine status list (40%) */}
        <GlassCard className="col-span-5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Machine Status</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>6 machines · live readings</p>
            </div>
            <div className="flex gap-1.5">
              {[['#ff4444', 1], ['#ffb300', 2], ['#00ff88', 3]].map(([c, n]) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}>{n}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {MACHINES.map((m, i) => (
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
            <p className="text-xs" style={{ color: '#8892a4' }}>Batch inference results · {ALL_PREDICTIONS.length} machines</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Risk legend */}
            {Object.entries(RISK_META).map(([k, v]) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color }}>
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 px-6 py-2.5 text-[10px] uppercase tracking-widest"
          style={{ color: '#8892a4', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="col-span-2">Machine ID</span>
          <span className="col-span-3">Timestamp</span>
          <span className="col-span-2">Failure Prob.</span>
          <span className="col-span-2">Risk Level</span>
          <span className="col-span-3">Action Recommended</span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.03)' }}>
          {pageData.map((row, i) => {
            const meta = RISK_META[row.risk]
            return (
              <div
                key={row.id + row.ts}
                className="grid grid-cols-12 items-center px-6 py-3.5 transition-colors"
                style={{
                  background: meta.bg,
                  borderLeft: `2px solid ${meta.color}40`,
                  animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
                }}
              >
                {/* Machine ID */}
                <span className="col-span-2 text-xs font-bold mono text-white">{row.id}</span>

                {/* Timestamp */}
                <span className="col-span-3 flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
                  <Clock size={11} />
                  {row.ts}
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
                    {row.risk === 'Critical' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color, animation: 'warnBlink 0.9s ease infinite' }} />}
                    {row.risk}
                  </span>
                </span>

                {/* Action */}
                <span className="col-span-3 text-xs" style={{ color: '#c8d3e0' }}>{row.action}</span>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#8892a4' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, ALL_PREDICTIONS.length)} of {ALL_PREDICTIONS.length} predictions
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
