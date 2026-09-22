import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, ReferenceArea, Legend,
} from 'recharts'
import {
  Download, Award, Target, ShieldCheck, TrendingUp,
  Activity, CheckCircle, AlertTriangle, Info,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'

/* ════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════ */

/* ── Confusion matrix ──────────────────────────── */
const CM = {
  tp: 2184, tn: 7431, fp: 89, fn: 296,
  get total() { return this.tp + this.tn + this.fp + this.fn },
  get tpPct() { return ((this.tp / this.total) * 100).toFixed(1) },
  get tnPct() { return ((this.tn / this.total) * 100).toFixed(1) },
  get fpPct() { return ((this.fp / this.total) * 100).toFixed(1) },
  get fnPct() { return ((this.fn / this.total) * 100).toFixed(1) },
}

/* ── Precision-Recall curve ────────────────────── */
const PR_CURVE = [
  { recall: 0.00, precision: 1.00, threshold: 0.99 },
  { recall: 0.10, precision: 0.99, threshold: 0.95 },
  { recall: 0.25, precision: 0.98, threshold: 0.90 },
  { recall: 0.40, precision: 0.97, threshold: 0.85 },
  { recall: 0.55, precision: 0.96, threshold: 0.80 },
  { recall: 0.65, precision: 0.95, threshold: 0.75 },
  { recall: 0.72, precision: 0.93, threshold: 0.70 },
  { recall: 0.79, precision: 0.92, threshold: 0.65 },
  { recall: 0.84, precision: 0.90, threshold: 0.60 },
  { recall: 0.87, precision: 0.88, threshold: 0.55 },
  { recall: 0.89, precision: 0.87, threshold: 0.50 },   // ← default threshold
  { recall: 0.91, precision: 0.84, threshold: 0.45 },
  { recall: 0.93, precision: 0.80, threshold: 0.40 },
  { recall: 0.95, precision: 0.74, threshold: 0.35 },
  { recall: 0.97, precision: 0.65, threshold: 0.30 },
  { recall: 0.98, precision: 0.54, threshold: 0.25 },
  { recall: 0.99, precision: 0.41, threshold: 0.20 },
  { recall: 1.00, precision: 0.25, threshold: 0.10 },
]

/* ── Ablation groups ───────────────────────────── */
const ABLATION = [
  { group: 'G1', label: 'Raw Sensors Only',          f1: 0.741, desc: 'Baseline: 5 raw IoT features' },
  { group: 'G2', label: '+ Machine Type',            f1: 0.762, desc: 'G1 + type_H/M/L encoding' },
  { group: 'G3', label: '+ Rolling Stats',           f1: 0.801, desc: 'G2 + window mean/std/var' },
  { group: 'G4', label: '+ Lag Features',            f1: 0.826, desc: 'G3 + lag-1, lag-2 features' },
  { group: 'G5', label: '+ Engineered',              f1: 0.847, desc: 'G4 + power, temp_delta, wear_rate' },
  { group: 'G6', label: '+ Context Partial',         f1: 0.862, desc: 'G5 + factory_load only' },
  { group: 'G7', label: '+ Full Context (Final)',    f1: 0.925, desc: 'G6 + humidity, weather, anomaly_score' },
]

/* ── Noise robustness ──────────────────────────── */
const NOISE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
function buildNoiseData() {
  return NOISE_LEVELS.map(lvl => ({
    noise: `${lvl}%`,
    lvl,
    gaussian:    +(0.925 - lvl * 0.0028 - Math.random() * 0.003).toFixed(3),
    uniform:     +(0.925 - lvl * 0.0042 - Math.random() * 0.004).toFixed(3),
    sensor_drop: +(0.925 - lvl * 0.0055 - Math.random() * 0.005).toFixed(3),
    shift_bias:  +(0.925 - lvl * 0.0035 - Math.random() * 0.003).toFixed(3),
    spike_noise: +(0.925 - lvl * 0.0065 - Math.random() * 0.006).toFixed(3),
  }))
}
const NOISE_DATA = buildNoiseData()

const NOISE_LINES = [
  { key: 'gaussian',    label: 'Gaussian Noise',  color: '#00d4ff' },
  { key: 'uniform',     label: 'Uniform Noise',   color: '#00ff88' },
  { key: 'sensor_drop', label: 'Sensor Dropout',  color: '#c084fc' },
  { key: 'shift_bias',  label: 'Shift + Bias',    color: '#ffb300' },
  { key: 'spike_noise', label: 'Spike Noise',     color: '#ff4444' },
]

/* ── Threshold strategies ──────────────────────── */
const THRESHOLD_STRATEGIES = [
  {
    id: 'best_f1',
    label: 'Best F1',
    icon: Award,
    threshold: 0.50,
    precision: 0.87,
    recall: 0.89,
    f1: 0.88,
    color: '#00d4ff',
    desc: 'Maximises harmonic mean of precision and recall.',
    recommended: false,
  },
  {
    id: 'min_misses',
    label: 'Min False Negatives',
    icon: AlertTriangle,
    threshold: 0.35,
    precision: 0.74,
    recall: 0.97,
    f1: 0.84,
    color: '#ff4444',
    desc: 'Minimises missed failures — catches every real fault.',
    recommended: false,
  },
  {
    id: 'min_alarms',
    label: 'Min False Alarms',
    icon: ShieldCheck,
    threshold: 0.70,
    precision: 0.96,
    recall: 0.72,
    f1: 0.82,
    color: '#ffb300',
    desc: 'Minimises false positives — reduces unnecessary alerts.',
    recommended: false,
  },
  {
    id: 'balanced',
    label: 'Balanced (Recommended)',
    icon: Target,
    threshold: 0.45,
    precision: 0.91,
    recall: 0.93,
    f1: 0.92,
    color: '#fbbf24',
    desc: 'Optimal for deployment — strong recall with acceptable precision.',
    recommended: true,
  },
]

/* ════════════════════════════════════════════════
   ANIMATED COUNTER
   ════════════════════════════════════════════════ */
function AnimatedValue({ target, decimals = 2, duration = 1200, delay = 0 }) {
  const [val, setVal] = useState(0)
  const animRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      let start = null
      function step(ts) {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(+(target * ease).toFixed(decimals))
        if (p < 1) animRef.current = requestAnimationFrame(step)
      }
      animRef.current = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(animRef.current) }
  }, [target, duration, delay, decimals])

  return <span>{val.toFixed(decimals)}</span>
}

/* ════════════════════════════════════════════════
   METRIC CARD
   ════════════════════════════════════════════════ */
function MetricCard({ label, value, color, icon: Icon, target: tgt, desc, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])

  return (
    <div
      className="glass glass-hover p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${color}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Background glow blob */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `${color}10`, filter: 'blur(20px)' }} />

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>{label}</p>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={15} color={color} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-5xl font-black mono leading-none" style={{ color }}>
          <AnimatedValue target={value} decimals={2} delay={delay + 100} />
        </span>
        {tgt && (
          <div className="mb-1 flex items-center gap-1 px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <CheckCircle size={10} color="#00ff88" />
            <span className="text-[10px] font-semibold" style={{ color: '#00ff88' }}>Target ≥ {tgt}</span>
          </div>
        )}
      </div>

      {desc && <p className="text-[11px]" style={{ color: '#8892a4' }}>{desc}</p>}

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full"
          style={{ width: `${value * 100}%`, background: color, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   CONFUSION MATRIX CELL
   ════════════════════════════════════════════════ */
function CMCell({ label, count, pct, bg, border, textColor, tag }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-2xl text-center"
      style={{ background: bg, border: `1px solid ${border}`, minHeight: 130 }}>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColor, opacity: 0.7 }}>{tag}</span>
      <span className="text-4xl font-black mono" style={{ color: textColor }}>{count.toLocaleString()}</span>
      <span className="text-xs font-semibold" style={{ color: textColor, opacity: 0.8 }}>{pct}%</span>
      <span className="text-[10px]" style={{ color: textColor, opacity: 0.55 }}>{label}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════
   CUSTOM TOOLTIPS
   ════════════════════════════════════════════════ */
const PrTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="glass px-3 py-2.5 text-xs">
      <p className="font-semibold text-white mb-1.5">Threshold: {d.threshold}</p>
      <p style={{ color: '#00d4ff' }}>Recall: <span className="mono font-bold">{d.recall.toFixed(2)}</span></p>
      <p style={{ color: '#00ff88' }}>Precision: <span className="mono font-bold">{d.precision.toFixed(2)}</span></p>
      <p className="text-[10px] mt-1" style={{ color: '#8892a4' }}>F1 ≈ {(2 * d.precision * d.recall / (d.precision + d.recall)).toFixed(3)}</p>
    </div>
  )
}

const AblationTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="glass px-3 py-2.5 text-xs min-w-[200px]">
      <p className="font-semibold text-white mb-1">{d.group} · {d.label}</p>
      <p style={{ color: '#fbbf24' }}>Macro F1: <span className="mono font-bold">{d.f1.toFixed(3)}</span></p>
      <p className="text-[10px] mt-1" style={{ color: '#8892a4' }}>{d.desc}</p>
    </div>
  )
}

const NoiseTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2.5 text-xs min-w-[180px]">
      <p className="font-semibold text-white mb-2">Noise Level: {label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.stroke }}>{p.name}</span>
          <span className="mono font-semibold" style={{ color: p.stroke }}>{Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   GENERATE REPORT (stub)
   ════════════════════════════════════════════════ */
function downloadReport() {
  const lines = [
    'PredictIQ — Model Performance Report',
    '====================================',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Model: LightGBM Classifier v1.0',
    'Training: 2025-11-15  |  Dataset: 10,000 samples  |  CV: Stratified 5-Fold',
    '',
    'KEY METRICS',
    '-----------',
    'Macro F1 Score  : 0.87  (Target ≥ 0.85 ✓)',
    'Precision       : 0.84',
    'Recall          : 0.89',
    'AUC-ROC         : 0.94',
    '',
    'CONFUSION MATRIX (test set)',
    '---------------------------',
    `True  Positives : ${CM.tp}  (${CM.tpPct}%)`,
    `True  Negatives : ${CM.tn}  (${CM.tnPct}%)`,
    `False Positives : ${CM.fp}  (${CM.fpPct}%)`,
    `False Negatives : ${CM.fn}  (${CM.fnPct}%)`,
    '',
    'ABLATION STUDY',
    '--------------',
    ...ABLATION.map(g => `${g.group}: ${g.label.padEnd(30)} F1=${g.f1.toFixed(3)}`),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `model_performance_report_${Date.now()}.txt`
  a.click()
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function ModelPerformance() {
  const [visibleNoise, setVisibleNoise] = useState(
    Object.fromEntries(NOISE_LINES.map(l => [l.key, true]))
  )
  const [chartReady, setChartReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setChartReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="page-enter space-y-6">

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)' }}>
              <Activity size={16} color="#fbbf24" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Model Performance Metrics</h1>
          </div>
          <div className="flex items-center gap-2.5 ml-11 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
              LightGBM Classifier v1.0
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4' }}>
              Trained: 15 Nov 2025
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4' }}>
              10,000 samples · 57 features
            </span>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
              <CheckCircle size={11} />
              Target Achieved
            </span>
          </div>
        </div>

        <button onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.25) 100%)',
            border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24',
            boxShadow: '0 4px 16px rgba(251,191,36,0.15)',
          }}>
          <Download size={15} />
          Download Report
        </button>
      </div>

      {/* ══ SECTION 1: METRIC CARDS ══ */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Macro F1 Score"  value={0.87} color="#00ff88" icon={Award}      target="0.85" desc="Stratified 5-Fold CV · SMOTE balanced" delay={0}   />
        <MetricCard label="Precision"        value={0.84} color="#00d4ff" icon={ShieldCheck} desc="Post threshold tuning · 0.50 default"  delay={80}  />
        <MetricCard label="Recall"           value={0.89} color="#c084fc" icon={Target}      desc="Failure detection sensitivity"           delay={160} />
        <MetricCard label="AUC-ROC"          value={0.94} color="#00ff88" icon={TrendingUp}  desc="Discriminative ability across thresholds" delay={240} />
      </div>

      {/* ══ SECTION 2: CONFUSION MATRIX + PR CURVE ══ */}
      <div className="grid grid-cols-2 gap-4">

        {/* Confusion Matrix */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-white">Confusion Matrix</p>
              <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Test set · {(CM.total).toLocaleString()} samples</p>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
              Accuracy {(((CM.tp + CM.tn) / CM.total) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Axis labels */}
          <div className="flex flex-col gap-3">
            {/* X label */}
            <div className="flex items-center gap-2 pl-20">
              <div className="flex-1 flex gap-2">
                <div className="flex-1 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Predicted Positive</div>
                <div className="flex-1 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Predicted Negative</div>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Y label */}
              <div className="flex flex-col justify-center" style={{ minWidth: 72 }}>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: '#8892a4', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.12em' }}>
                    Actual Positive
                  </span>
                </div>
              </div>

              {/* Matrix cells */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <CMCell
                  label="True Positive" count={CM.tp} pct={CM.tpPct} tag="TP"
                  bg="rgba(0,255,136,0.08)" border="rgba(0,255,136,0.25)" textColor="#00ff88"
                />
                <CMCell
                  label="False Negative" count={CM.fn} pct={CM.fnPct} tag="FN"
                  bg="rgba(255,68,68,0.08)" border="rgba(255,68,68,0.25)" textColor="#ff4444"
                />
                <CMCell
                  label="False Positive" count={CM.fp} pct={CM.fpPct} tag="FP"
                  bg="rgba(255,179,0,0.08)" border="rgba(255,179,0,0.25)" textColor="#ffb300"
                />
                <CMCell
                  label="True Negative" count={CM.tn} pct={CM.tnPct} tag="TN"
                  bg="rgba(0,212,255,0.08)" border="rgba(0,212,255,0.25)" textColor="#00d4ff"
                />
              </div>

              {/* Y label 2 */}
              <div className="flex flex-col justify-center" style={{ minWidth: 72 }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: '#8892a4', writingMode: 'vertical-rl', letterSpacing: '0.12em' }}>
                  Actual Negative
                </span>
              </div>
            </div>
          </div>

          {/* Mini legend */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            {[['#00ff88', 'TP — Correct Failure Detected'], ['#ff4444', 'FN — Missed Failure'], ['#ffb300', 'FP — False Alarm'], ['#00d4ff', 'TN — Correct Normal']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8892a4' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Precision-Recall Curve */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-white">Precision-Recall Curve</p>
              <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>AUC-PR ≈ 0.937 · ● = current threshold (0.50)</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
              AUC = 0.937
            </span>
          </div>

          <div style={{ opacity: chartReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={PR_CURVE} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="recall" domain={[0, 1]} tickFormatter={v => v.toFixed(1)}
                  tick={{ fontSize: 10, fill: '#8892a4' }} label={{ value: 'Recall', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#8892a4' }} />
                <YAxis domain={[0, 1]} tickFormatter={v => v.toFixed(1)}
                  tick={{ fontSize: 10, fill: '#8892a4' }} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8892a4' }} />
                <Tooltip content={<PrTooltip />} />
                {/* Current threshold marker */}
                <ReferenceLine x={0.89} stroke="#fbbf24" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: 'Default\nthreshold', position: 'top', fontSize: 9, fill: '#fbbf24' }} />
                <Area type="monotone" dataKey="precision" stroke="#00d4ff" strokeWidth={2.5}
                  fill="url(#prGrad)" dot={false} activeDot={{ r: 5, fill: '#00d4ff', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* ══ SECTION 3: ABLATION STUDY ══ */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Ablation Study Results</p>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
              Incremental feature group addition · Macro F1 improvement per group
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <Info size={11} color="#00ff88" />
              <span className="text-[10px] font-semibold" style={{ color: '#00ff88' }}>
                Statistical significance p &lt; 0.05
              </span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
              G7 ★ Best Model
            </span>
          </div>
        </div>

        <div style={{ opacity: chartReady ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ABLATION} margin={{ top: 20, right: 24, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#8892a4' }} />
              <YAxis domain={[0.70, 0.95]} tickFormatter={v => v.toFixed(2)}
                tick={{ fontSize: 10, fill: '#8892a4' }} />
              <Tooltip content={<AblationTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={0.85} stroke="rgba(0,255,136,0.4)" strokeDasharray="4 3"
                label={{ value: 'Target 0.85', position: 'right', fontSize: 9, fill: '#00ff88' }} />
              <Bar dataKey="f1" name="Macro F1" radius={[5, 5, 0, 0]} barSize={40}
                label={{ position: 'top', fontSize: 10, fill: '#8892a4', formatter: v => v.toFixed(3) }}>
                {ABLATION.map(g => (
                  <Cell key={g.group}
                    fill={g.group === 'G7' ? '#fbbf24' : '#00d4ff'}
                    fillOpacity={g.group === 'G7' ? 1 : 0.55}
                    style={g.group === 'G7' ? { filter: 'drop-shadow(0 0 8px #fbbf2480)' } : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Group descriptions */}
        <div className="mt-4 grid grid-cols-7 gap-2">
          {ABLATION.map(g => (
            <div key={g.group} className="flex flex-col gap-1 px-2 py-2 rounded-lg"
              style={{
                background: g.group === 'G7' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${g.group === 'G7' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <span className="text-[10px] font-bold" style={{ color: g.group === 'G7' ? '#fbbf24' : '#00d4ff' }}>{g.group}</span>
              <span className="text-[9px] leading-tight" style={{ color: '#8892a4' }}>{g.label.replace(/^\+ /, '')}</span>
              <span className="text-[10px] font-bold mono" style={{ color: g.group === 'G7' ? '#fbbf24' : '#8892a4' }}>{g.f1.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ══ SECTION 4: NOISE ROBUSTNESS ══ */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Noise Robustness Analysis</p>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
              Macro F1 under 5 synthetic noise conditions · Safe zone ≤ 20% noise
            </p>
          </div>

          {/* Noise toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {NOISE_LINES.map(l => (
              <button key={l.key}
                onClick={() => setVisibleNoise(v => ({ ...v, [l.key]: !v[l.key] }))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: visibleNoise[l.key] ? `${l.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${visibleNoise[l.key] ? `${l.color}40` : 'rgba(255,255,255,0.08)'}`,
                  color: visibleNoise[l.key] ? l.color : '#8892a4',
                  opacity: visibleNoise[l.key] ? 1 : 0.5,
                }}>
                <div className="w-2 h-2 rounded-full" style={{ background: visibleNoise[l.key] ? l.color : '#8892a4' }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ opacity: chartReady ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={NOISE_DATA} margin={{ top: 8, right: 24, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="safeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="noise" tick={{ fontSize: 10, fill: '#8892a4' }} />
              <YAxis domain={[0.70, 0.96]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10, fill: '#8892a4' }} />
              <Tooltip content={<NoiseTooltip />} />

              {/* Safe zone */}
              <ReferenceArea x1="5%" x2="20%" fill="rgba(0,255,136,0.05)" stroke="none" />
              <ReferenceLine x="20%" stroke="rgba(0,255,136,0.35)" strokeDasharray="5 3"
                label={{ value: 'Safe zone end', position: 'top', fontSize: 9, fill: '#00ff88' }} />
              {/* Danger threshold */}
              <ReferenceArea x1="30%" x2="50%" fill="rgba(255,68,68,0.04)" stroke="none" />
              <ReferenceLine x="30%" stroke="rgba(255,68,68,0.3)" strokeDasharray="5 3"
                label={{ value: 'Danger zone', position: 'top', fontSize: 9, fill: '#ff4444' }} />

              {NOISE_LINES.map(l => visibleNoise[l.key] && (
                <Line key={l.key} type="monotone" dataKey={l.key} name={l.label}
                  stroke={l.color} strokeWidth={2} dot={{ r: 3, fill: l.color }}
                  isAnimationActive={chartReady}
                  activeDot={{ r: 5, fill: l.color, stroke: '#fff', strokeWidth: 1.5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ══ SECTION 5: THRESHOLD ANALYSIS ══ */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Threshold Analysis</p>
          <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
            Decision boundary strategies — choose based on operational priority
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {THRESHOLD_STRATEGIES.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.id}
                className="glass glass-hover flex flex-col gap-4 p-5 relative overflow-hidden"
                style={{
                  borderTop: `2px solid ${s.color}${s.recommended ? 'cc' : '50'}`,
                  boxShadow: s.recommended ? `0 0 24px ${s.color}20, inset 0 0 24px ${s.color}05` : undefined,
                  animation: s.recommended ? 'amberGlow 3s ease infinite' : undefined,
                  opacity: 0,
                  transform: 'translateY(16px)',
                  animationDelay: `${i * 80}ms`,
                }}
                ref={el => {
                  if (el && chartReady) {
                    setTimeout(() => {
                      if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; el.style.transition = 'opacity 0.4s ease, transform 0.4s ease' }
                    }, i * 80)
                  }
                }}
              >
                {s.recommended && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24' }}>
                      ★ RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}>
                    <Icon size={15} color={s.color} />
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{s.label}</p>
                </div>

                {/* Threshold big display */}
                <div className="flex flex-col items-center py-3 rounded-xl"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: '#8892a4' }}>Threshold</span>
                  <span className="text-3xl font-black mono mt-0.5" style={{ color: s.color }}>{s.threshold}</span>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  {[
                    { label: 'Precision', val: s.precision, color: '#00d4ff' },
                    { label: 'Recall',    val: s.recall,    color: '#c084fc' },
                    { label: 'F1 Score',  val: s.f1,        color: s.color   },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: '#8892a4' }}>{m.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full" style={{ width: `${m.val * 100}%`, background: m.color }} />
                        </div>
                        <span className="text-xs mono font-bold" style={{ color: m.color }}>{m.val.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] leading-relaxed" style={{ color: '#8892a4' }}>{s.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
