import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Info } from 'lucide-react'
import GlassCard from '../components/GlassCard'

/* ── Feature importance (top 20 from model_metadata.json) ── */
const RAW_FEATURES = [
  { name: 'power',                        importance: 0.187, group: 'engineered' },
  { name: 'Tool wear [min]_roll_mean',    importance: 0.142, group: 'rolling'    },
  { name: 'Torque [Nm]_roll_mean',        importance: 0.128, group: 'rolling'    },
  { name: 'Tool wear [min]',              importance: 0.115, group: 'raw'        },
  { name: 'Torque [Nm]',                  importance: 0.109, group: 'raw'        },
  { name: 'torque_per_rpm',               importance: 0.094, group: 'engineered' },
  { name: 'Tool wear [min]_roc',          importance: 0.083, group: 'lag'        },
  { name: 'tool_wear_rate',               importance: 0.079, group: 'engineered' },
  { name: 'power_roc',                    importance: 0.071, group: 'lag'        },
  { name: 'Torque [Nm]_lag1',             importance: 0.065, group: 'lag'        },
  { name: 'Rotational speed [rpm]',       importance: 0.058, group: 'raw'        },
  { name: 'temp_delta',                   importance: 0.051, group: 'engineered' },
  { name: 'Process temperature [K]',      importance: 0.048, group: 'raw'        },
  { name: 'temp_wear_interaction',        importance: 0.043, group: 'engineered' },
  { name: 'Torque [Nm]_roc',             importance: 0.041, group: 'lag'        },
  { name: 'total_anomaly_score',          importance: 0.038, group: 'contextual' },
  { name: 'Air temperature [K]',          importance: 0.035, group: 'raw'        },
  { name: 'factory_load',                 importance: 0.031, group: 'contextual' },
  { name: 'Torque [Nm]_roll_std',        importance: 0.028, group: 'rolling'    },
  { name: 'humidity_pct',                 importance: 0.025, group: 'contextual' },
]

const GROUP_COLORS = {
  raw:        '#00d4ff',
  rolling:    '#00ff88',
  engineered: '#ffb300',
  lag:        '#ff4444',
  contextual: '#c084fc',
}

const GROUP_LABELS = {
  raw:        'Raw Sensor',
  rolling:    'Rolling Stats',
  engineered: 'Engineered',
  lag:        'Lag / ROC',
  contextual: 'Contextual',
}

const DESCRIPTIONS = {
  'power':                        'Rotational speed × Torque — top predictive feature',
  'Tool wear [min]_roll_mean':    'Rolling average of tool wear over recent window',
  'Torque [Nm]_roll_mean':        'Smoothed torque trend captures gradual degradation',
  'Tool wear [min]':              'Raw cumulative tool wear in minutes',
  'Torque [Nm]':                  'Raw torque reading from spindle',
  'torque_per_rpm':               'Torque normalized by rotational speed',
  'Tool wear [min]_roc':          'Rate of change of tool wear — detects rapid wear',
  'tool_wear_rate':               'Tool wear / rotational speed interaction',
  'power_roc':                    'Rate of change of mechanical power output',
  'Torque [Nm]_lag1':             '1-step lagged torque for temporal correlation',
  'Rotational speed [rpm]':       'Raw spindle speed measurement',
  'temp_delta':                   'Process temp − Air temp difference',
  'Process temperature [K]':      'Process chamber temperature in Kelvin',
  'temp_wear_interaction':        'Temperature × Tool wear cross-feature',
  'Torque [Nm]_roc':             'Rate of change of torque over time',
  'total_anomaly_score':          'Composite outlier score across all sensors',
  'Air temperature [K]':          'Ambient air temperature in Kelvin',
  'factory_load':                 'External factory operational load context',
  'Torque [Nm]_roll_std':        'Variability in torque over rolling window',
  'humidity_pct':                 'External ambient humidity — contextual data fusion',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass px-4 py-3 text-xs max-w-[260px]">
      <p className="font-semibold text-white mb-1">{d.name}</p>
      <p className="mb-2" style={{ color: GROUP_COLORS[d.group] }}>
        {GROUP_LABELS[d.group]} · Importance: {(d.importance * 100).toFixed(1)}%
      </p>
      <p style={{ color: '#8892a4' }}>{DESCRIPTIONS[d.name] || ''}</p>
    </div>
  )
}

export default function FeatureAnalysis() {
  const [activeGroup, setActiveGroup] = useState('all')
  const [sortBy, setSortBy] = useState('importance')

  const filtered = RAW_FEATURES
    .filter(f => activeGroup === 'all' || f.group === activeGroup)
    .sort((a, b) => sortBy === 'importance' ? b.importance - a.importance : a.name.localeCompare(b.name))

  const totalImportance = RAW_FEATURES.reduce((s, f) => s + f.importance, 0)

  /* group summary */
  const groupSummary = Object.entries(GROUP_COLORS).map(([g, c]) => {
    const total = RAW_FEATURES.filter(f => f.group === g).reduce((s, f) => s + f.importance, 0)
    return { group: g, color: c, label: GROUP_LABELS[g], total, pct: total / totalImportance * 100 }
  }).sort((a, b) => b.total - a.total)

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">SHAP Feature Importance</h2>
          <p className="text-xs" style={{ color: '#8892a4' }}>Top 20 of 57 features · LightGBM model</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSortBy('importance')} className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: sortBy === 'importance' ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                     border: `1px solid ${sortBy === 'importance' ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                     color: sortBy === 'importance' ? '#00d4ff' : '#8892a4' }}>
            By Importance
          </button>
          <button onClick={() => setSortBy('name')} className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ background: sortBy === 'name' ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                     border: `1px solid ${sortBy === 'name' ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                     color: sortBy === 'name' ? '#00d4ff' : '#8892a4' }}>
            Alphabetical
          </button>
        </div>
      </div>

      {/* Group pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setActiveGroup('all')}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
          style={{ background: activeGroup === 'all' ? '#00d4ff22' : 'rgba(255,255,255,0.04)',
                   border: `1px solid ${activeGroup === 'all' ? '#00d4ff55' : 'rgba(255,255,255,0.08)'}`,
                   color: activeGroup === 'all' ? '#00d4ff' : '#8892a4' }}>
          All Groups
        </button>
        {Object.entries(GROUP_COLORS).map(([g, c]) => (
          <button key={g} onClick={() => setActiveGroup(g === activeGroup ? 'all' : g)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{ background: activeGroup === g ? `${c}22` : 'rgba(255,255,255,0.04)',
                     border: `1px solid ${activeGroup === g ? `${c}55` : 'rgba(255,255,255,0.08)'}`,
                     color: activeGroup === g ? c : '#8892a4' }}>
            {GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main chart */}
        <GlassCard className="col-span-8 p-5">
          <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">
            Feature Importance Score
          </p>
          <ResponsiveContainer width="100%" height={480}>
            <BarChart
              data={filtered}
              layout="vertical"
              margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 0.20]}
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: '#8892a4' }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={210}
                tick={{ fontSize: 10, fill: '#c8d3e0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]} barSize={14}
                label={{ position: 'right', fontSize: 10, fill: '#8892a4', formatter: v => `${(v*100).toFixed(1)}%` }}>
                {filtered.map(f => (
                  <Cell key={f.name} fill={GROUP_COLORS[f.group]}
                    fillOpacity={activeGroup === 'all' || activeGroup === f.group ? 1 : 0.25} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Group summary */}
        <div className="col-span-4 space-y-4">
          <GlassCard className="p-5">
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">By Feature Group</p>
            <div className="space-y-3">
              {groupSummary.map(({ group, color, label, pct }) => (
                <div key={group}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color }}>{label}</span>
                    <span className="text-xs font-semibold mono" style={{ color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Feature count */}
          <GlassCard className="p-5">
            <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Model Info</p>
            <div className="space-y-2">
              {[
                { label: 'Total Features',  val: '57' },
                { label: 'Shown in Chart',  val: '20' },
                { label: 'Algorithm',       val: 'LightGBM' },
                { label: 'Top Feature',     val: 'power' },
                { label: 'Num Leaves',      val: '43' },
                { label: 'N Estimators',    val: '274' },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: '#8892a4' }}>{label}</span>
                  <span className="text-xs font-semibold mono text-white">{val}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Legend */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Info size={12} color="#8892a4" />
              <p className="text-[11px] font-semibold text-white">Color Legend</p>
            </div>
            <div className="space-y-1.5">
              {Object.entries(GROUP_LABELS).map(([g, label]) => (
                <div key={g} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: GROUP_COLORS[g] }} />
                  <span className="text-[11px]" style={{ color: '#8892a4' }}>{label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
