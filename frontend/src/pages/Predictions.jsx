import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  Cpu, RefreshCw, Play, Radio, Clock, CheckCircle,
  AlertTriangle, XCircle, ChevronDown, Zap, TrendingUp,
  Thermometer, Gauge, Wrench, Wind, RotateCcw,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'

/* ════════════════════════════════════════════════
   CONSTANTS & DATA
   ════════════════════════════════════════════════ */
const SENSOR_FIELDS = [
  { key: 'airTemp',  label: 'Air Temperature',     unit: 'K',   min: 295, max: 308, step: 0.1, icon: Thermometer, color: '#00d4ff', def: 300.5 },
  { key: 'procTemp', label: 'Process Temperature', unit: 'K',   min: 305, max: 316, step: 0.1, icon: Wind,        color: '#c084fc', def: 310.8 },
  { key: 'rpm',      label: 'Rotational Speed',    unit: 'RPM', min: 1000, max: 3000, step: 10, icon: Gauge,      color: '#00ff88', def: 1500  },
  { key: 'torque',   label: 'Torque',              unit: 'Nm',  min: 0,   max: 80,  step: 0.5, icon: Zap,        color: '#ffb300', def: 40.0  },
  { key: 'toolWear', label: 'Tool Wear',           unit: 'min', min: 0,   max: 250, step: 1,   icon: Wrench,     color: '#ff4444', def: 80    },
]

const MACHINE_TYPES = ['L', 'M', 'H']

/* ── SHAP feature importance (simulated) ──────── */
function computeShap(inputs) {
  return [
    { feature: 'power (torque×rpm)', impact: +((inputs.torque * inputs.rpm / 45000 - 1) * 0.19).toFixed(3) },
    { feature: 'tool_wear_rate',      impact: +((inputs.toolWear / 250 - 0.3) * 0.15).toFixed(3) },
    { feature: 'torque_per_rpm',      impact: +((inputs.torque / (inputs.rpm / 100) - 2.5) * 0.1).toFixed(3) },
    { feature: 'temp_delta',          impact: +(((inputs.procTemp - inputs.airTemp) / 12 - 0.8) * 0.09).toFixed(3) },
    { feature: 'Tool wear [min]',     impact: +((inputs.toolWear / 200 - 0.4) * 0.12).toFixed(3) },
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
}

/* ── Simulate model output ─────────────────────── */
function simulateModel(inputs) {
  const power     = (inputs.torque * inputs.rpm) / 45000
  const wearPct   = inputs.toolWear / 250
  const delta     = inputs.procTemp - inputs.airTemp
  const rawScore  =
    0.22 * Math.min(power / 3, 1)
    + 0.25 * wearPct
    + 0.18 * Math.max(0, (delta - 8) / 6)
    + 0.15 * Math.max(0, (inputs.torque - 50) / 30)
    + 0.12 * Math.max(0, (inputs.rpm - 2000) / 1000)
    + (inputs.machineType === 'H' ? 0.06 : inputs.machineType === 'M' ? 0.02 : -0.02)
  return Math.min(0.99, Math.max(0.02, rawScore + (Math.random() - 0.5) * 0.04))
}

function probLabel(p) {
  if (p >= 0.70) return { text: 'FAILURE LIKELY',    status: 'critical', color: '#ff4444', bg: 'rgba(255,68,68,0.12)',  border: 'rgba(255,68,68,0.35)'  }
  if (p >= 0.30) return { text: 'MONITOR CLOSELY',   status: 'warning',  color: '#ffb300', bg: 'rgba(255,179,0,0.12)', border: 'rgba(255,179,0,0.35)' }
  return           { text: 'NORMAL OPERATION',       status: 'normal',   color: '#00ff88', bg: 'rgba(0,255,136,0.10)', border: 'rgba(0,255,136,0.3)'  }
}

function actionText(p) {
  if (p >= 0.85) return 'Initiate emergency shutdown and dispatch maintenance team immediately.'
  if (p >= 0.70) return 'Schedule urgent maintenance within 2 hours. Reduce operational load.'
  if (p >= 0.50) return 'Increase monitoring frequency. Inspect tool wear and torque levels.'
  if (p >= 0.30) return 'Log anomaly, review next scheduled maintenance window.'
  return 'No action required. Continue normal operation and routine checks.'
}

const INITIAL_INPUTS = {
  airTemp: 300.5, procTemp: 310.8, rpm: 1500, torque: 40.0, toolWear: 80, machineType: 'M',
}

/* ── History seed ───────────────────────────────── */
const SEED_HISTORY = [
  { time: '19:54:12', prob: 0.92, result: 'Failure', known: true  },
  { time: '19:48:07', prob: 0.67, result: 'Warning', known: true  },
  { time: '19:41:30', prob: 0.23, result: 'Normal',  known: true  },
  { time: '19:35:59', prob: 0.78, result: 'Failure', known: true  },
  { time: '19:29:14', prob: 0.41, result: 'Warning', known: true  },
  { time: '19:22:08', prob: 0.11, result: 'Normal',  known: true  },
  { time: '19:15:33', prob: 0.85, result: 'Failure', known: true  },
]

/* ════════════════════════════════════════════════
   SVG PROBABILITY GAUGE
   ════════════════════════════════════════════════ */
function ProbGauge({ prob, loading }) {
  const [displayed, setDisplayed] = useState(0)
  const animRef = useRef(null)

  useEffect(() => {
    if (loading) { setDisplayed(0); return }
    let start = null
    const from = displayed
    const to   = prob
    const DURATION = 1200

    function step(ts) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / DURATION, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplayed(from + (to - from) * ease)
      if (progress < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [prob, loading])

  const SIZE = 260
  const cx = SIZE / 2, cy = SIZE / 2
  const R = 108
  const SA = 215, SWEEP = 290
  const norm = Math.min(1, Math.max(0, displayed))
  const fillSweep = norm * SWEEP
  const meta = probLabel(prob)
  const color = loading ? '#8892a4' : displayed >= 0.7 ? '#ff4444' : displayed >= 0.3 ? '#ffb300' : '#00ff88'
  const pct = Math.round(displayed * 100)

  function polar(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arc(start, sweep, radius) {
    const end = start + sweep
    const p1 = polar(start, radius), p2 = polar(end, radius)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}`
  }

  // danger zone arc (70-100%)
  const dangerStart = SA + 0.7 * SWEEP

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background track */}
        <path d={arc(SA, SWEEP, R)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" strokeLinecap="round" />

        {/* Zone overlays */}
        <path d={arc(SA, 0.3 * SWEEP, R)} fill="none" stroke="rgba(0,255,136,0.12)" strokeWidth="16" />
        <path d={arc(SA + 0.3 * SWEEP, 0.4 * SWEEP, R)} fill="none" stroke="rgba(255,179,0,0.12)" strokeWidth="16" />
        <path d={arc(dangerStart, 0.3 * SWEEP, R)} fill="none" stroke="rgba(255,68,68,0.15)" strokeWidth="16" />

        {/* Fill */}
        {!loading && fillSweep > 0 && (
          <path d={arc(SA, fillSweep, R)} fill="none"
            stroke={color} strokeWidth="16" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}90)` }} />
        )}

        {/* Tick marks */}
        {Array.from({ length: 30 }, (_, i) => {
          const a = SA + (i / 29) * SWEEP
          const p1 = polar(a, R + 6), p2 = polar(a, R + (i % 5 === 0 ? 16 : 10))
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={i % 5 === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}
            strokeWidth={i % 5 === 0 ? 1.5 : 0.8} />
        })}

        {/* Zone labels */}
        {[
          { a: SA + 0.12 * SWEEP, label: '30%', color: '#00ff88' },
          { a: SA + 0.50 * SWEEP, label: '70%', color: '#ffb300' },
          { a: SA + 0.85 * SWEEP, label: '100%',color: '#ff4444' },
        ].map(({ a, label, color: c }) => {
          const p = polar(a, R + 26)
          return <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={c}>{label}</text>
        })}

        {/* Loading spinner arc */}
        {loading && (
          <path d={arc(SA, 80, R)} fill="none" stroke="#00d4ff" strokeWidth="16" strokeLinecap="round"
            style={{ animation: 'spin 1s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
        {loading ? (
          <>
            <RefreshCw size={28} color="#00d4ff" style={{ animation: 'spin 1s linear infinite' }} />
            <span className="text-sm font-medium mt-2" style={{ color: '#8892a4' }}>Computing…</span>
          </>
        ) : (
          <>
            <span className="text-6xl font-black mono leading-none" style={{ color, transition: 'color 0.5s ease' }}>{pct}%</span>
            <span className="text-xs font-medium mt-1" style={{ color: '#8892a4' }}>Failure Probability</span>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   SLIDER + NUMBER INPUT
   ════════════════════════════════════════════════ */
function SensorInput({ field, value, onChange }) {
  const Icon = field.icon
  const norm = (value - field.min) / (field.max - field.min)
  const thumbColor = field.color

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} color={field.color} />
          <span className="text-[11px] font-medium" style={{ color: '#c8d3e0' }}>{field.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={e => onChange(+e.target.value)}
            className="w-20 text-right text-xs font-semibold mono rounded-md px-2 py-0.5 outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: field.color,
            }}
          />
          <span className="text-[10px]" style={{ color: '#8892a4' }}>{field.unit}</span>
        </div>
      </div>

      {/* Custom-styled range */}
      <div className="relative flex items-center" style={{ height: 20 }}>
        {/* Track fill */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none"
          style={{ width: `${norm * 100}%`, background: field.color, opacity: 0.7, boxShadow: `0 0 6px ${field.color}50` }} />
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.08)', zIndex: -1 }} />
        <input
          type="range"
          min={field.min} max={field.max} step={field.step}
          value={value}
          onChange={e => onChange(+e.target.value)}
          className="w-full appearance-none bg-transparent cursor-pointer"
          style={{ '--thumb-color': field.color }}

        />
      </div>

      {/* Min/Max hint */}
      <div className="flex justify-between text-[9px]" style={{ color: '#8892a4' }}>
        <span>{field.min}</span><span>{field.max} {field.unit}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   SHAP TOOLTIP
   ════════════════════════════════════════════════ */
const ShapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="font-semibold text-white">{payload[0].payload.feature}</p>
      <p style={{ color: v >= 0 ? '#ff4444' : '#00d4ff' }}>
        Impact: <span className="font-bold mono">{v >= 0 ? '+' : ''}{v}</span>
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: '#8892a4' }}>
        {v >= 0 ? '▲ Increases failure risk' : '▼ Reduces failure risk'}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════
   HISTORY ITEM
   ════════════════════════════════════════════════ */
function HistoryRow({ item, idx }) {
  const meta = probLabel(item.prob)
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), idx * 60); return () => clearTimeout(t) }, [idx])

  return (
    <div className="flex items-center gap-4 transition-all"
      style={{ opacity: show ? 1 : 0, transform: show ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease' }}>
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center gap-0" style={{ minWidth: 16 }}>
        <div className="w-3 h-3 rounded-full shrink-0"
          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}80`, animation: item.prob >= 0.7 ? 'livePulse 2s infinite' : undefined }} />
        {idx < SEED_HISTORY.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.08)', height: 24 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl mb-2"
        style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" style={{ color: '#8892a4', minWidth: 72 }}>
            <Clock size={10} />
            <span className="text-[11px] mono">{item.time}</span>
          </div>
          <span className="text-xs font-semibold mono" style={{ color: meta.color }}>
            {(item.prob * 100).toFixed(0)}%
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
            {meta.text}
          </span>
        </div>
        {item.known && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8892a4' }}>
            {item.result === 'Failure'
              ? <><XCircle size={12} color="#ff4444" /><span style={{ color: '#ff4444' }}>Failure confirmed</span></>
              : item.result === 'Warning'
              ? <><AlertTriangle size={12} color="#ffb300" /><span style={{ color: '#ffb300' }}>Anomaly detected</span></>
              : <><CheckCircle size={12} color="#00ff88" /><span style={{ color: '#00ff88' }}>Normal confirmed</span></>
            }
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MACHINE TYPE DROPDOWN
   ════════════════════════════════════════════════ */
function MachineDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d3e0' }}>
        <span>Machine Type: <span className="font-bold" style={{ color: '#00d4ff' }}>Type {value}</span></span>
        <ChevronDown size={12} color="#8892a4" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 glass rounded-xl overflow-hidden">
          {MACHINE_TYPES.map(t => (
            <button key={t} onClick={() => { onChange(t); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-colors"
              style={{ background: t === value ? 'rgba(0,212,255,0.12)' : 'transparent', color: t === value ? '#00d4ff' : '#c8d3e0' }}>
              <span className="font-bold">Type {t}</span>
              <span style={{ color: '#8892a4' }}>
                {t === 'H' ? '— High quality steel' : t === 'M' ? '— Medium alloy' : '— Low grade standard'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */
export default function Predictions() {
  const [inputs, setInputs] = useState(INITIAL_INPUTS)
  const [prob, setProb] = useState(0.42)
  const [loading, setLoading] = useState(false)
  const [shap, setShap] = useState(() => computeShap(INITIAL_INPUTS))
  const [history, setHistory] = useState(SEED_HISTORY)
  const [useLive, setUseLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [hasRun, setHasRun] = useState(false)
  const liveRef = useRef(null)

  const meta = probLabel(prob)

  /* Update individual field */
  const setField = useCallback((key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }))
  }, [])

  /* Live data feed */
  useEffect(() => {
    if (!useLive) { if (liveRef.current) clearInterval(liveRef.current); return }
    liveRef.current = setInterval(() => {
      setInputs({
        airTemp:     +(300 + (Math.random() - 0.5) * 6).toFixed(1),
        procTemp:    +(310 + (Math.random() - 0.5) * 5).toFixed(1),
        rpm:         Math.round(1500 + (Math.random() - 0.5) * 800),
        torque:      +(40  + (Math.random() - 0.5) * 30).toFixed(1),
        toolWear:    +(inputs.toolWear + Math.random() * 1.5).toFixed(0),
        machineType: inputs.machineType,
      })
    }, 1500)
    return () => clearInterval(liveRef.current)
  }, [useLive])

  /* Run prediction */
  const runPrediction = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 600))
    const result = simulateModel(inputs)
    setProb(result)
    setShap(computeShap(inputs))
    setLastUpdated(new Date())
    setHasRun(true)
    setHistory(prev => [{
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      prob: result,
      result: result >= 0.7 ? 'Failure' : result >= 0.3 ? 'Warning' : 'Normal',
      known: false,
    }, ...prev.slice(0, 9)])
    setLoading(false)
  }, [inputs])

  return (
    <div className="page-enter space-y-5">

      {/* ══ HEADER ══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.35)' }}>
              <Cpu size={16} color="#00d4ff" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Failure Prediction Engine</h1>
          </div>
          <div className="flex items-center gap-3 ml-10">
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
              LightGBM · Macro F1: 0.9249
            </span>
            <span className="text-xs" style={{ color: '#8892a4' }}>·</span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: '#8892a4' }}>
              <Clock size={11} />
              Last updated: {lastUpdated.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          </div>
        </div>

        <button onClick={runPrediction} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #0096ff 0%, #00d4ff 100%)',
            boxShadow: '0 4px 20px rgba(0,212,255,0.35)',
            color: '#fff',
            transform: loading ? 'scale(0.97)' : undefined,
          }}>
          {loading
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Computing…</>
            : <><Play size={15} /> Run Prediction</>
          }
        </button>
      </div>

      {/* ══ MAIN 3-COL LAYOUT ══ */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── LEFT: Input Panel ── */}
        <GlassCard className="col-span-4 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Sensor Inputs</p>
            {/* Live data toggle */}
            <button onClick={() => setUseLive(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: useLive ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${useLive ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: useLive ? '#00ff88' : '#8892a4',
              }}>
              <Radio size={11} style={{ animation: useLive ? 'pulsate 1.5s ease infinite' : undefined }} />
              {useLive ? 'Live ON' : 'Use Live Data'}
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {SENSOR_FIELDS.map(f => (
              <SensorInput key={f.key} field={f} value={inputs[f.key]} onChange={v => setField(f.key, v)} />
            ))}
          </div>

          {/* Machine type */}
          <div className="pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <MachineDropdown value={inputs.machineType} onChange={v => setField('machineType', v)} />
          </div>

          {/* Reset + Predict */}
          <div className="flex gap-2">
            <button onClick={() => { setInputs(INITIAL_INPUTS); setUseLive(false) }}
              className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4' }}>
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={runPrediction} disabled={loading}
              className="flex items-center gap-1.5 flex-[2] justify-center py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(0,150,255,0.4) 0%, rgba(0,212,255,0.4) 100%)',
                border: '1px solid rgba(0,212,255,0.4)',
                color: '#00d4ff',
              }}>
              {loading
                ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Computing…</>
                : <><Zap size={12} /> Predict Now</>
              }
            </button>
          </div>
        </GlassCard>

        {/* ── CENTER: Main Prediction Card ── */}
        <GlassCard className="col-span-4 p-6 flex flex-col items-center gap-4"
          style={{ borderTop: `2px solid ${meta.color}60` }}>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8892a4' }}>Prediction Result</p>
            {hasRun && !loading && (
              <p className="text-xs mt-1" style={{ color: '#8892a4' }}>Machine Type-{inputs.machineType} · {SENSOR_FIELDS.find(f => f.key === 'toolWear')?.label}: {inputs.toolWear} min</p>
            )}
          </div>

          {/* Big gauge */}
          <ProbGauge prob={prob} loading={loading} />

          {/* Status badge */}
          {!loading && (
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                color: meta.color,
                animation: meta.status === 'critical' ? 'amberGlow 1.5s ease infinite' : undefined,
                boxShadow: meta.status === 'critical' ? `0 0 20px ${meta.color}40` : undefined,
              }}
            >
              {meta.status === 'critical' && (
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color, animation: 'warnBlink 0.7s ease infinite' }} />
              )}
              {meta.status === 'warning' && (
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color, animation: 'warnBlink 1.2s ease infinite' }} />
              )}
              {meta.status === 'normal' && <span className="status-dot live" style={{ width: 8, height: 8 }} />}
              {meta.text}
            </div>
          )}

          {/* Action text */}
          {!loading && (
            <div className="w-full px-4 py-3.5 rounded-xl text-center"
              style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}18` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: meta.color }}>Recommended Action</p>
              <p className="text-xs leading-relaxed" style={{ color: '#c8d3e0' }}>{actionText(prob)}</p>
            </div>
          )}

          {/* Quick metric strip */}
          {!loading && (
            <div className="w-full grid grid-cols-3 gap-2">
              {[
                { label: 'Confidence', val: `${Math.round(Math.abs(prob - 0.5) * 180 + 10)}%`, color: '#00d4ff' },
                { label: 'Threshold',  val: '0.50',                                             color: '#8892a4' },
                { label: 'Risk Level', val: meta.status === 'critical' ? 'HIGH' : meta.status === 'warning' ? 'MED' : 'LOW', color: meta.color },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex flex-col items-center py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: '#8892a4' }}>{label}</span>
                  <span className="text-sm font-bold mono mt-0.5" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* ── RIGHT: SHAP Chart ── */}
        <GlassCard className="col-span-4 p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white">SHAP Feature Impact</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#8892a4' }}>Top 5 features for this prediction</p>
          </div>

          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#8892a4' }}>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: '#ff4444' }} /> Increases risk</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm" style={{ background: '#00d4ff' }} /> Reduces risk</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={shap} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[-0.2, 0.2]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 9, fill: '#8892a4' }} />
              <YAxis type="category" dataKey="feature" width={140} tick={{ fontSize: 10, fill: '#c8d3e0' }} />
              <Tooltip content={<ShapTooltip />} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <Bar dataKey="impact" name="SHAP Impact" radius={[0, 4, 4, 0]} barSize={18}
                label={{ position: 'right', fontSize: 9, fill: '#8892a4', formatter: v => (v >= 0 ? '+' : '') + v }}>
                {shap.map(d => (
                  <Cell key={d.feature} fill={d.impact >= 0 ? '#ff4444' : '#00d4ff'}
                    fillOpacity={0.8 + Math.abs(d.impact) * 2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Feature contribution summary */}
          <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#8892a4' }}>Contribution Summary</p>
            {shap.map(d => (
              <div key={d.feature} className="flex items-center justify-between">
                <span className="text-[11px] truncate max-w-[60%]" style={{ color: '#8892a4' }}>{d.feature}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, Math.abs(d.impact) * 500)}%`,
                      background: d.impact >= 0 ? '#ff4444' : '#00d4ff',
                      marginLeft: d.impact < 0 ? 'auto' : undefined,
                    }} />
                  </div>
                  <span className="text-[10px] mono font-semibold w-10 text-right"
                    style={{ color: d.impact >= 0 ? '#ff4444' : '#00d4ff' }}>
                    {d.impact >= 0 ? '+' : ''}{d.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Model info strip */}
          <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="grid grid-cols-2 gap-y-1 text-[10px]">
              {[
                ['Algorithm', 'LightGBM'],
                ['Features', '57 total'],
                ['Folds', 'Stratified 5-Fold'],
                ['Sampling', 'SMOTE'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: '#8892a4' }}>{k}: </span>
                  <span className="font-semibold" style={{ color: '#00d4ff' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ══ HISTORY TIMELINE ══ */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-white">Recent Predictions History</p>
            <p className="text-xs" style={{ color: '#8892a4' }}>Timeline · {history.length} predictions</p>
          </div>
          <div className="flex items-center gap-3">
            {[['#ff4444', 'Critical'], ['#ffb300', 'Warning'], ['#00ff88', 'Normal']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8892a4' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-0 pl-2">
          {history.map((item, i) => (
            <HistoryRow key={`${item.time}-${i}`} item={item} idx={i} />
          ))}
        </div>
      </GlassCard>

    </div>
  )
}
