import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Filter, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'

/* ── Simulated batch predictions ───────────────────────── */
const MACHINES = [
  { id: 'M-7823', type: 'M', risk: 94, label: 'Tool Wear Failure',    confidence: 0.97, failTypes: { TWF: 0.81, HDF: 0.08, PWF: 0.06, OSF: 0.04, RNF: 0.01 } },
  { id: 'H-5502', type: 'H', risk: 83, label: 'Overstrain Detected',  confidence: 0.91, failTypes: { TWF: 0.09, HDF: 0.12, PWF: 0.04, OSF: 0.72, RNF: 0.03 } },
  { id: 'H-1042', type: 'H', risk: 71, label: 'Heat Diff Warning',    confidence: 0.88, failTypes: { TWF: 0.07, HDF: 0.74, PWF: 0.10, OSF: 0.06, RNF: 0.03 } },
  { id: 'L-3319', type: 'L', risk: 58, label: 'Power Fluctuation',    confidence: 0.79, failTypes: { TWF: 0.11, HDF: 0.09, PWF: 0.68, OSF: 0.08, RNF: 0.04 } },
  { id: 'M-0091', type: 'M', risk: 22, label: 'Normal Operation',     confidence: 0.96, failTypes: { TWF: 0.05, HDF: 0.04, PWF: 0.03, OSF: 0.02, RNF: 0.86 } },
  { id: 'L-7712', type: 'L', risk: 17, label: 'Normal Operation',     confidence: 0.98, failTypes: { TWF: 0.02, HDF: 0.03, PWF: 0.04, OSF: 0.03, RNF: 0.88 } },
  { id: 'H-3301', type: 'H', risk: 41, label: 'Minor Heat Variance',  confidence: 0.72, failTypes: { TWF: 0.14, HDF: 0.49, PWF: 0.16, OSF: 0.13, RNF: 0.08 } },
  { id: 'M-5590', type: 'M', risk: 65, label: 'Tool Wear Moderate',   confidence: 0.84, failTypes: { TWF: 0.61, HDF: 0.15, PWF: 0.09, OSF: 0.10, RNF: 0.05 } },
  { id: 'L-0014', type: 'L', risk: 9,  label: 'Normal Operation',     confidence: 0.99, failTypes: { TWF: 0.01, HDF: 0.01, PWF: 0.02, OSF: 0.01, RNF: 0.95 } },
  { id: 'H-9988', type: 'H', risk: 78, label: 'Overstrain Risk',      confidence: 0.86, failTypes: { TWF: 0.08, HDF: 0.11, PWF: 0.06, OSF: 0.70, RNF: 0.05 } },
]

const FAIL_COLORS = { TWF: '#ffb300', HDF: '#00d4ff', PWF: '#ff4444', OSF: '#00ff88', RNF: '#8892a4' }
const FAIL_LABELS = { TWF: 'Tool Wear', HDF: 'Heat Diff', PWF: 'Power', OSF: 'Overstrain', RNF: 'Random' }

function riskStatus(r) { return r >= 80 ? 'danger' : r >= 50 ? 'warning' : 'healthy' }
function riskColor(r)  { return r >= 80 ? '#ff4444' : r >= 50 ? '#ffb300' : '#00ff88' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="font-semibold text-white">{FAIL_LABELS[payload[0]?.dataKey] || payload[0]?.dataKey}</p>
      <p style={{ color: payload[0]?.fill }}>{(payload[0]?.value * 100).toFixed(1)}% probability</p>
    </div>
  )
}

/* ── Risk gauge ─────────────────────────────────────────── */
function RiskGauge({ value }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = riskColor(value)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-bold mono" style={{ color }}>{value}%</span>
        <span className="text-[10px]" style={{ color: '#8892a4' }}>Risk Score</span>
      </div>
    </div>
  )
}

export default function Predictions() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(MACHINES[0])
  const [sortAsc, setSortAsc] = useState(false)

  const visible = MACHINES
    .filter(m => filter === 'All' || m.type === filter)
    .sort((a, b) => sortAsc ? a.risk - b.risk : b.risk - a.risk)

  const failData = Object.entries(selected.failTypes).map(([k, v]) => ({ name: k, value: v, label: FAIL_LABELS[k] }))

  return (
    <div className="page-enter space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={14} color="#8892a4" />
          <span className="text-xs" style={{ color: '#8892a4' }}>Filter by type:</span>
          {['All', 'H', 'M', 'L'].map(t => (
            <button key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === t ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === t ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === t ? '#00d4ff' : '#8892a4',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#8892a4' }}>{visible.length} machines</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Table */}
        <GlassCard className="col-span-7 p-0 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-white">Prediction Results</p>
            <button
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#8892a4' }}
              onClick={() => setSortAsc(a => !a)}
            >
              Sort {sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase tracking-wider" style={{ color: '#8892a4' }}>
              <span className="col-span-2">Machine</span>
              <span className="col-span-1">Type</span>
              <span className="col-span-4">Prediction</span>
              <span className="col-span-3">Risk Score</span>
              <span className="col-span-2">Status</span>
            </div>
            {visible.map(m => (
              <button
                key={m.id}
                className="grid grid-cols-12 items-center w-full px-5 py-3 text-left transition-colors"
                style={{
                  background: selected.id === m.id ? 'rgba(0,212,255,0.06)' : 'transparent',
                  borderLeft: selected.id === m.id ? '2px solid #00d4ff' : '2px solid transparent',
                }}
                onClick={() => setSelected(m)}
              >
                <span className="col-span-2 text-xs font-semibold mono text-white">{m.id}</span>
                <span className="col-span-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>{m.type}</span>
                </span>
                <span className="col-span-4 text-xs" style={{ color: '#c8d3e0' }}>{m.label}</span>
                <span className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.risk}%`, background: riskColor(m.risk), transition: 'width 0.5s ease' }} />
                    </div>
                    <span className="text-xs mono font-medium" style={{ color: riskColor(m.risk), minWidth: 32 }}>{m.risk}%</span>
                  </div>
                </span>
                <span className="col-span-2">
                  <StatusBadge status={riskStatus(m.risk)} showDot={false}
                    label={m.risk >= 80 ? 'Critical' : m.risk >= 50 ? 'Warning' : 'Safe'} />
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Detail panel */}
        <div className="col-span-5 space-y-4">
          {/* Gauge */}
          <GlassCard className="p-5 flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm font-bold text-white">{selected.id}</p>
                <p className="text-xs" style={{ color: '#8892a4' }}>{selected.label}</p>
              </div>
              <StatusBadge status={riskStatus(selected.risk)} />
            </div>
            <RiskGauge value={selected.risk} />
            <div className="w-full flex items-center justify-between px-2">
              <div>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Confidence</p>
                <p className="text-sm font-bold mono" style={{ color: '#00d4ff' }}>{(selected.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Machine Type</p>
                <p className="text-sm font-bold" style={{ color: '#00ff88' }}>Type {selected.type}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: '#8892a4' }}>Threshold</p>
                <p className="text-sm font-bold mono text-white">0.50</p>
              </div>
            </div>
          </GlassCard>

          {/* Failure type probabilities */}
          <GlassCard className="p-5">
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Failure Probabilities</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={failData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8892a4' }} />
                <YAxis domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fontSize: 9, fill: '#8892a4' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Probability" radius={[4, 4, 0, 0]} barSize={24}>
                  {failData.map(d => <Cell key={d.name} fill={FAIL_COLORS[d.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-1 mt-3">
              {Object.entries(FAIL_LABELS).map(([k, v]) => (
                <div key={k} className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px]" style={{ color: FAIL_COLORS[k] }}>■</span>
                  <span className="text-[9px] text-center" style={{ color: '#8892a4' }}>{v}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
