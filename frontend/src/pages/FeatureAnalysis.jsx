import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Info, Cpu, Wind, Layers, Zap, TrendingUp, AlertTriangle,
  ChevronDown, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'

/* ════════════════════════════════════════════════
   DATA  (derived from model_metadata.json + SHAP analysis)
   ════════════════════════════════════════════════ */

/* ── 15 global features ─────────────────────── */
const GLOBAL_FEATURES = [
  { name: 'Tool wear [min]',              importance: 0.187, category: 'sensor',      color: '#fbbf24' },
  { name: 'Torque [Nm]',                  importance: 0.164, category: 'sensor',      color: '#00d4ff' },
  { name: 'factory_load',                 importance: 0.142, category: 'external',    color: '#a78bfa' },
  { name: 'power (torque×rpm)',           importance: 0.128, category: 'engineered',  color: '#ffb300' },
  { name: 'temp_delta',                   importance: 0.115, category: 'engineered',  color: '#ffb300' },
  { name: 'Tool wear [min]_roll_mean',    importance: 0.096, category: 'rolling',     color: '#c084fc' },
  { name: 'Torque [Nm]_roll_mean',        importance: 0.083, category: 'rolling',     color: '#c084fc' },
  { name: 'Rotational speed [rpm]',       importance: 0.071, category: 'sensor',      color: '#00d4ff' },
  { name: 'torque_per_rpm',              importance: 0.065, category: 'engineered',  color: '#ffb300' },
  { name: 'total_anomaly_score',          importance: 0.058, category: 'external',    color: '#a78bfa' },
  { name: 'Torque [Nm]_lag1',            importance: 0.051, category: 'rolling',     color: '#c084fc' },
  { name: 'tool_wear_rate',              importance: 0.044, category: 'engineered',  color: '#ffb300' },
  { name: 'humidity_pct',                importance: 0.039, category: 'external',    color: '#a78bfa' },
  { name: 'Process temperature [K]',     importance: 0.033, category: 'sensor',      color: '#00d4ff' },
  { name: 'Air temperature [K]',         importance: 0.025, category: 'sensor',      color: '#00d4ff' },
]

/* ── Category cards ─────────────────────────── */
const CATEGORIES = [
  {
    key: 'sensor', label: 'IoT Sensors', pct: 45, color: '#00d4ff',
    icon: Cpu,
    features: ['Air Temp', 'Process Temp', 'RPM', 'Torque', 'Tool Wear'],
    desc: 'Raw sensor readings from the machine spindle and environment.',
  },
  {
    key: 'rolling', label: 'Rolling Features', pct: 25, color: '#c084fc',
    icon: Layers,
    features: ['roll_mean', 'roll_std', 'roll_var', 'lag features'],
    desc: 'Temporal window statistics capturing trend and variability.',
  },
  {
    key: 'external', label: 'External Context', pct: 20, color: '#00ff88',
    icon: Wind,
    features: ['factory_load', 'humidity', 'weather', 'anomaly_score'],
    desc: 'Contextual data fusion from outside the machine envelope.',
  },
  {
    key: 'engineered', label: 'Engineered', pct: 10, color: '#ffb300',
    icon: Zap,
    features: ['power', 'temp_delta', 'tool_wear_rate', 'torque/rpm'],
    desc: 'Domain-derived cross-features with strongest signal-to-noise.',
  },
]

/* ── Waterfall machines ─────────────────────── */
const WATERFALL_MACHINES = [
  { id: 'M-7823', label: 'M-7823 (Critical)', finalProb: 0.94 },
  { id: 'H-5502', label: 'H-5502 (Warning)',  finalProb: 0.67 },
  { id: 'L-3319', label: 'L-3319 (Normal)',   finalProb: 0.18 },
]

function makeWaterfall(finalProb) {
  const base = 0.42
  const steps = [
    { name: 'Base Value',        delta: 0,   cumulative: base },
    { name: 'Tool Wear',         delta: finalProb > 0.6 ? +0.21 : +0.07 },
    { name: 'Torque [Nm]',      delta: finalProb > 0.6 ? +0.14 : +0.03 },
    { name: 'factory_load',      delta: finalProb > 0.6 ? +0.09 : -0.04 },
    { name: 'power',             delta: finalProb > 0.6 ? +0.06 : -0.08 },
    { name: 'temp_delta',        delta: finalProb > 0.6 ? +0.05 : -0.06 },
    { name: 'humidity_pct',      delta: -0.03 },
    { name: 'RPM',               delta: finalProb > 0.6 ? +0.02 : -0.04 },
    { name: 'type_encoded',      delta: finalProb > 0.6 ? +0.01 : -0.02 },
  ]

  let running = base
  return steps.map((s, i) => {
    if (i === 0) return { ...s, start: base, end: base, type: 'base' }
    const start = running
    running = Math.max(0, Math.min(1, running + s.delta))
    return { ...s, start, end: running, type: s.delta >= 0 ? 'up' : 'down' }
  }).concat([{ name: 'Prediction', start: 0, end: running, cumulative: running, type: 'final' }])
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

/* ── SHAP info tooltip ──────────────────────── */
function ShapInfoBubble() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
        style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)' }}
      >
        <Info size={12} color="#00d4ff" />
      </button>
      {open && (
        <div
          className="absolute left-8 top-0 z-50 glass rounded-xl p-4 text-xs leading-relaxed"
          style={{ width: 300, color: '#c8d3e0' }}
        >
          <p className="font-semibold text-white mb-2">What is SHAP?</p>
          <p className="mb-2">
            <strong style={{ color: '#00d4ff' }}>SH</strong>apley <strong style={{ color: '#00d4ff' }}>A</strong>dditive ex<strong style={{ color: '#00d4ff' }}>P</strong>lanations
            — a game-theory method that assigns each feature a contribution
            value for a specific prediction.
          </p>
          <p className="mb-2">
            <span style={{ color: '#ff4444' }}>▲ Positive SHAP</span> = feature <em>increases</em> failure probability.
          </p>
          <p>
            <span style={{ color: '#00d4ff' }}>▼ Negative SHAP</span> = feature <em>decreases</em> failure probability.
          </p>
          <button onClick={() => setOpen(false)} className="mt-3 text-[10px]" style={{ color: '#8892a4' }}>Dismiss</button>
        </div>
      )}
    </div>
  )
}

/* ── Category ring card ─────────────────────── */
function CategoryRing({ cat, delay = 0 }) {
  const [pct, setPct] = useState(0)
  const Icon = cat.icon
  const SIZE = 100, R = 40
  const circ = 2 * Math.PI * R
  const offset = circ - (pct / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setPct(cat.pct), delay + 200)
    return () => clearTimeout(t)
  }, [cat.pct, delay])

  return (
    <GlassCard className="p-5 flex flex-col items-center gap-3"
      style={{ borderTop: `2px solid ${cat.color}50` }}>
      {/* Ring */}
      <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx={50} cy={50} r={R} fill="none"
            stroke={cat.color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
              filter: `drop-shadow(0 0 6px ${cat.color}70)`,
            }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black mono" style={{ color: cat.color }}>{pct}%</span>
        </div>
      </div>

      {/* Label + icon */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg"
          style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>
          <Icon size={12} color={cat.color} />
        </div>
        <p className="text-xs font-semibold text-white">{cat.label}</p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-1 justify-center">
        {cat.features.map(f => (
          <span key={f} className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}25`, color: cat.color }}>
            {f}
          </span>
        ))}
      </div>

      {/* Desc */}
      <p className="text-[10px] text-center leading-relaxed" style={{ color: '#8892a4' }}>{cat.desc}</p>
    </GlassCard>
  )
}

/* ── Global feature chart tooltip ────────────── */
const GlobalTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const catMeta = CATEGORIES.find(c => c.key === d.category)
  return (
    <div className="glass px-4 py-3 text-xs min-w-[200px]">
      <p className="font-semibold text-white mb-1 leading-tight">{d.name}</p>
      <p style={{ color: d.color }}>SHAP Importance: <span className="font-bold mono">{(d.importance * 100).toFixed(1)}%</span></p>
      <p className="mt-1" style={{ color: catMeta?.color || '#8892a4' }}>Category: {catMeta?.label}</p>
    </div>
  )
}

/* ── Waterfall bar (rendered via recharts custom Bar) ── */
const WaterfallTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const delta = d.end - d.start
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="font-semibold text-white mb-1">{d.name}</p>
      {d.type !== 'base' && d.type !== 'final' && (
        <p style={{ color: delta >= 0 ? '#ff4444' : '#00d4ff' }}>
          {delta >= 0 ? '▲ +' : '▼ '}{(delta * 100).toFixed(1)}% to failure prob.
        </p>
      )}
      <p style={{ color: '#8892a4' }}>Cumulative: <span className="mono font-semibold text-white">{(d.end * 100).toFixed(0)}%</span></p>
    </div>
  )
}

/* ── Machine dropdown ───────────────────────── */
function MachineSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [])
  const selected = WATERFALL_MACHINES.find(m => m.id === value)
  const probMeta = selected?.finalProb >= 0.7 ? { color: '#ff4444', label: 'Critical' }
    : selected?.finalProb >= 0.3 ? { color: '#ffb300', label: 'Warning' }
    : { color: '#00ff88', label: 'Normal' }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d3e0', minWidth: 200 }}>
        <span className="w-2 h-2 rounded-full" style={{ background: probMeta.color }} />
        <span className="flex-1 text-left font-semibold">{value}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${probMeta.color}15`, color: probMeta.color }}>
          {(selected?.finalProb * 100).toFixed(0)}%
        </span>
        <ChevronDown size={12} color="#8892a4" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 glass rounded-xl overflow-hidden" style={{ minWidth: 220 }}>
          {WATERFALL_MACHINES.map(m => {
            const pm = m.finalProb >= 0.7 ? '#ff4444' : m.finalProb >= 0.3 ? '#ffb300' : '#00ff88'
            return (
              <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }}
                className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-colors"
                style={{ background: m.id === value ? 'rgba(0,212,255,0.1)' : 'transparent', color: '#c8d3e0' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: pm }} />
                <span className="flex-1 font-semibold">{m.label}</span>
                <span className="mono" style={{ color: pm }}>{(m.finalProb * 100).toFixed(0)}%</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Waterfall custom shape ─────────────────── */
function WaterfallBar(props) {
  const { x, y, width, height, payload } = props
  if (!payload) return null

  const color = payload.type === 'base' ? '#8892a4'
    : payload.type === 'final' ? '#00d4ff'
    : payload.type === 'up' ? '#ff4444' : '#00d4ff'

  const label = payload.type === 'base' ? `${(payload.end * 100).toFixed(0)}%`
    : payload.type === 'final' ? `${(payload.end * 100).toFixed(0)}%`
    : `${payload.end - payload.start >= 0 ? '+' : ''}${((payload.end - payload.start) * 100).toFixed(0)}%`

  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.abs(height)} rx={3} ry={3}
        fill={color} fillOpacity={payload.type === 'final' ? 0.9 : 0.75}
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      <text x={x + width + 4} y={y + Math.abs(height) / 2 + 4} fontSize={10}
        fill={color} fontWeight={600} fontFamily="monospace">
        {label}
      </text>
    </g>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function FeatureAnalysis() {
  const [activeCat, setActiveCat] = useState('all')
  const [selectedMachine, setSelectedMachine] = useState('M-7823')
  const [chartVisible, setChartVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setChartVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const machine = WATERFALL_MACHINES.find(m => m.id === selectedMachine)
  const waterfallData = makeWaterfall(machine.finalProb)

  /* Filter + sort global features */
  const displayed = GLOBAL_FEATURES
    .filter(f => activeCat === 'all' || f.category === activeCat)

  return (
    <div className="page-enter space-y-6">

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>
              <TrendingUp size={16} color="#fbbf24" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Model Explainability</h1>
            <ShapInfoBubble />
          </div>
          <p className="text-xs ml-11" style={{ color: '#8892a4' }}>
            SHAP Value Analysis · LightGBM · 57 features · Stratified 5-Fold CV
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveCat('all')}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: activeCat === 'all' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeCat === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: activeCat === 'all' ? '#fff' : '#8892a4',
            }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCat(c.key)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={{
                background: activeCat === c.key ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeCat === c.key ? `${c.color}45` : 'rgba(255,255,255,0.08)'}`,
                color: activeCat === c.key ? c.color : '#8892a4',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ SECTION 1: GLOBAL IMPORTANCE ══ */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-white">Global Feature Importance</p>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
              Mean |SHAP| across all predictions · top {displayed.length} features
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              ['#fbbf24', '#1 Tool Wear'],
              ['#00d4ff', 'Sensor'],
              ['#c084fc', 'Rolling'],
              ['#a78bfa', 'External'],
              ['#ffb300', 'Engineered'],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8892a4' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        <div style={{ opacity: chartVisible ? 1 : 0, transform: chartVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.55s ease' }}>
          <ResponsiveContainer width="100%" height={displayed.length * 38 + 24}>
            <BarChart
              data={displayed}
              layout="vertical"
              margin={{ top: 0, right: 80, bottom: 0, left: 8 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 0.21]}
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: '#8892a4' }}
              />
              <YAxis
                type="category" dataKey="name" width={210}
                tick={{ fontSize: 10.5, fill: '#d1d9e6', fontFamily: 'monospace' }}
              />
              <Tooltip content={<GlobalTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="importance" name="Importance" radius={[0, 5, 5, 0]} barSize={20}
                label={{
                  position: 'right', fontSize: 10, fill: '#8892a4',
                  formatter: v => `${(v * 100).toFixed(1)}%`,
                }}>
                {displayed.map((f, i) => (
                  <Cell key={f.name}
                    fill={f.name === 'Tool wear [min]' ? '#fbbf24' : f.color}
                    fillOpacity={i === 0 ? 1 : 0.75 - i * 0.02}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rank table quick summary */}
        <div className="mt-5 pt-4 border-t grid grid-cols-5 gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {GLOBAL_FEATURES.slice(0, 5).map((f, i) => (
            <div key={f.name} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ background: `${f.name === 'Tool wear [min]' ? '#fbbf24' : f.color}08`, border: `1px solid ${f.name === 'Tool wear [min]' ? '#fbbf24' : f.color}20` }}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: f.name === 'Tool wear [min]' ? '#fbbf24' : f.color }}>
                  #{i + 1}
                </span>
                <span className="text-[10px] mono font-bold"
                  style={{ color: f.name === 'Tool wear [min]' ? '#fbbf24' : f.color }}>
                  {(f.importance * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] font-medium leading-tight text-white">{f.name}</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(f.importance / GLOBAL_FEATURES[0].importance) * 100}%`, background: f.name === 'Tool wear [min]' ? '#fbbf24' : f.color }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ══ SECTION 2: CATEGORY BREAKDOWN ══ */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Feature Category Breakdown</p>
          <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Relative contribution of each feature group to model performance</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {CATEGORIES.map((c, i) => <CategoryRing key={c.key} cat={c} delay={i * 120} />)}
        </div>
      </div>

      {/* ══ SECTION 3: WATERFALL / INDIVIDUAL EXPLAINER ══ */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Individual Prediction Explainer</p>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
              Waterfall — how each feature pushes the prediction from base value
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px]" style={{ color: '#8892a4' }}>
              <span className="flex items-center gap-1.5">
                <ArrowUpRight size={12} color="#ff4444" />
                <span style={{ color: '#ff4444' }}>Increases risk</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowDownRight size={12} color="#00d4ff" />
                <span style={{ color: '#00d4ff' }}>Reduces risk</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2.5 rounded-sm" style={{ background: '#8892a4' }} />
                <span>Base value</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2.5 rounded-sm" style={{ background: '#00d4ff' }} />
                <span>Final prediction</span>
              </span>
            </div>
            <MachineSelect value={selectedMachine} onChange={setSelectedMachine} />
          </div>
        </div>

        {/* Base and final callouts */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(136,146,164,0.1)', border: '1px solid rgba(136,146,164,0.2)' }}>
            <span className="text-[11px]" style={{ color: '#8892a4' }}>Base Value (E[f(x)]):</span>
            <span className="font-bold mono text-sm text-white">42%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>→ Feature contributions →</div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: machine.finalProb >= 0.7 ? 'rgba(255,68,68,0.1)' : machine.finalProb >= 0.3 ? 'rgba(255,179,0,0.1)' : 'rgba(0,255,136,0.1)',
              border: `1px solid ${machine.finalProb >= 0.7 ? 'rgba(255,68,68,0.3)' : machine.finalProb >= 0.3 ? 'rgba(255,179,0,0.3)' : 'rgba(0,255,136,0.3)'}`,
            }}>
            <span className="text-[11px]" style={{ color: '#8892a4' }}>Final Prediction:</span>
            <span className="font-bold mono text-sm"
              style={{ color: machine.finalProb >= 0.7 ? '#ff4444' : machine.finalProb >= 0.3 ? '#ffb300' : '#00ff88' }}>
              {(machine.finalProb * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Waterfall chart using horizontal bars */}
        <div className="space-y-2">
          {waterfallData.filter(d => d.type !== 'final').map((d, i) => {
            const delta = d.end - d.start
            const pctWidth = Math.abs(delta) * 100 * 4      // scale to ≤ ~100%
            const baseOffset = d.type === 'base' ? 0 : d.start * 100 * 4
            const isBase = d.type === 'base'
            const barColor = isBase ? '#8892a4' : delta >= 0 ? '#ff4444' : '#00d4ff'
            const maxWidth = 450

            return (
              <div key={d.name} className="flex items-center gap-3"
                style={{ opacity: chartVisible ? 1 : 0, transform: chartVisible ? 'translateX(0)' : 'translateX(-10px)', transition: `all 0.45s ease ${i * 0.06}s` }}>
                {/* Feature name */}
                <span className="text-[11px] font-medium text-right shrink-0" style={{ color: '#c8d3e0', width: 170 }}>{d.name}</span>

                {/* Bar row */}
                <div className="relative flex-1 h-6 flex items-center" style={{ maxWidth }}>
                  {/* Gray track */}
                  <div className="absolute inset-0 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  {/* Connector (cumulative offset) */}
                  {!isBase && (
                    <div className="absolute top-1/2 left-0 h-px" style={{ width: `${Math.min(baseOffset, maxWidth)}%`, background: 'rgba(255,255,255,0.08)' }} />
                  )}
                  {/* Actual bar */}
                  <div
                    className="absolute h-5 rounded-md"
                    style={{
                      left: isBase ? 0 : `${Math.min(Math.min(d.start, d.end) * 100 * 4, 98)}%`,
                      width: isBase ? `${d.end * 100 * 4}%` : `${Math.max(pctWidth, 0.5)}%`,
                      background: barColor,
                      opacity: isBase ? 0.5 : 0.8,
                      boxShadow: `0 0 6px ${barColor}50`,
                      transition: 'width 0.6s ease, left 0.6s ease',
                    }}
                  />
                </div>

                {/* Delta label */}
                <div className="flex items-center gap-1 shrink-0" style={{ width: 80 }}>
                  {!isBase && (
                    delta >= 0
                      ? <ArrowUpRight size={11} color="#ff4444" />
                      : <ArrowDownRight size={11} color="#00d4ff" />
                  )}
                  <span className="text-[11px] mono font-semibold"
                    style={{ color: isBase ? '#8892a4' : delta >= 0 ? '#ff4444' : '#00d4ff' }}>
                    {isBase ? `${(d.end * 100).toFixed(0)}%` : `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`}
                  </span>
                </div>

                {/* Cumulative */}
                <span className="text-[10px] mono shrink-0" style={{ color: '#8892a4', width: 40, textAlign: 'right' }}>
                  {(d.end * 100).toFixed(0)}%
                </span>
              </div>
            )
          })}

          {/* Final bar */}
          {waterfallData.filter(d => d.type === 'final').map(d => (
            <div key="final" className="flex items-center gap-3 pt-2 border-t mt-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-[11px] font-bold text-right shrink-0" style={{ color: '#00d4ff', width: 170 }}>⇒ Final Prediction</span>
              <div className="relative flex-1 h-7 flex items-center" style={{ maxWidth: 450 }}>
                <div className="absolute inset-0 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="absolute h-6 rounded-md left-0"
                  style={{
                    width: `${d.end * 100 * 4}%`,
                    background: machine.finalProb >= 0.7 ? '#ff4444' : machine.finalProb >= 0.3 ? '#ffb300' : '#00ff88',
                    boxShadow: `0 0 12px ${machine.finalProb >= 0.7 ? '#ff4444' : machine.finalProb >= 0.3 ? '#ffb300' : '#00ff88'}60`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
              </div>
              <span className="text-sm font-black mono shrink-0"
                style={{ color: machine.finalProb >= 0.7 ? '#ff4444' : machine.finalProb >= 0.3 ? '#ffb300' : '#00ff88', width: 80 }}>
                {(machine.finalProb * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] mono shrink-0" style={{ color: '#8892a4', width: 40 }}></span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ══ SECTION 4: KEY INSIGHTS ══ */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Key Model Insights</p>
          <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Derived from SHAP analysis and ablation study</p>
        </div>
        <div className="grid grid-cols-3 gap-4">

          {/* Insight 1 */}
          <GlassCard className="p-5 flex flex-col gap-3 glass-hover" style={{ borderTop: '2px solid #fbbf2450' }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>
                <span className="text-lg">🔧</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">"Tool Wear is the #1 Predictor"</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#fbbf24' }}>Global SHAP rank #1 · 18.7% contribution</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Cumulative tool wear time has the strongest individual predictive signal.
              Machines with wear &gt;175 min show 3.2× higher failure probability.
            </p>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px]" style={{ color: '#8892a4' }}>Avg SHAP value</span>
              <span className="text-sm font-bold mono" style={{ color: '#fbbf24' }}>+0.187</span>
            </div>
          </GlassCard>

          {/* Insight 2 */}
          <GlassCard className="p-5 flex flex-col gap-3 glass-hover" style={{ borderTop: '2px solid #a78bfa50' }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)' }}>
                <span className="text-lg">🌐</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">"External Context Adds 20%"</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>Ablation study · factory_load + humidity</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Removing external contextual features (factory load, humidity, weather)
              drops Macro F1 by <strong className="text-white">+1.3%</strong> — the largest single ablation gain in the study.
            </p>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px]" style={{ color: '#8892a4' }}>F1 delta without context</span>
              <span className="text-sm font-bold mono" style={{ color: '#a78bfa' }}>−1.3%</span>
            </div>
          </GlassCard>

          {/* Insight 3 */}
          <GlassCard className="p-5 flex flex-col gap-3 glass-hover" style={{ borderTop: '2px solid #00d4ff50' }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.35)' }}>
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">"Torque Spikes = Danger Signal"</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#00d4ff' }}>Torque [Nm] · SHAP rank #2 · 16.4%</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Torque readings above 55 Nm correlate with <strong className="text-white">74%</strong> of confirmed failures.
              Combined with high tool wear, it's the strongest co-predictor in the model.
            </p>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px]" style={{ color: '#8892a4' }}>Failure rate &gt;55 Nm</span>
              <span className="text-sm font-bold mono" style={{ color: '#00d4ff' }}>74%</span>
            </div>
          </GlassCard>
        </div>
      </div>

    </div>
  )
}
