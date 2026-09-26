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

import {
  SENSOR_RANGES,
  clamp,
  INITIAL_MACHINES,
  generateRecentPredictions,
} from '../data/mockData'

/* ════════════════════════════════════════════════
   CONSTANTS & DATA
   ════════════════════════════════════════════════ */
const SENSOR_FIELDS = [
  { key: 'airTemp',  label: 'Air Temperature',     unit: 'K',   min: 295,  max: 305,  step: 0.1, icon: Thermometer, color: '#00d4ff', def: 299.8 },
  { key: 'procTemp', label: 'Process Temperature', unit: 'K',   min: 308,  max: 313,  step: 0.1, icon: Wind,        color: '#c084fc', def: 310.4 },
  { key: 'rpm',      label: 'Rotational Speed',    unit: 'RPM', min: 1200, max: 2800, step: 10,  icon: Gauge,       color: '#00ff88', def: 1750  },
  { key: 'torque',   label: 'Torque',              unit: 'Nm',  min: 35,   max: 65,   step: 0.5, icon: Zap,         color: '#ffb300', def: 48.0  },
  { key: 'toolWear', label: 'Tool Wear',           unit: 'min', min: 0,    max: 200,  step: 1,   icon: Wrench,      color: '#ff4444', def: 85    },
]

const MACHINES_LIST = INITIAL_MACHINES

/* ── SHAP feature importance (Tool Wear 0.42, Torque 0.31, Factory Load 0.18) ── */
function computeShap(inputs) {
  const wearImpact   = +(0.42 * (inputs.toolWear / 150 - 0.45)).toFixed(3)
  const torqueImpact = +(0.31 * (inputs.torque / 50 - 0.95)).toFixed(3)
  const loadImpact   = +(0.18 * ((inputs.machineType === 'H' ? 1.15 : inputs.machineType === 'M' ? 0.95 : 0.8) - 0.9)).toFixed(3)
  const powerImpact  = +(0.12 * ((inputs.torque * inputs.rpm / 85000) - 1.0)).toFixed(3)
  const deltaImpact  = +(0.09 * (((inputs.procTemp - inputs.airTemp) / 10.6) - 1.0)).toFixed(3)

  return [
    { feature: 'Tool Wear [min]',        impact: wearImpact,   baseWeight: 0.42 },
    { feature: 'Torque [Nm]',            impact: torqueImpact, baseWeight: 0.31 },
    { feature: 'Factory Load',           impact: loadImpact,   baseWeight: 0.18 },
    { feature: 'Power (Torque × Speed)', impact: powerImpact,  baseWeight: 0.12 },
    { feature: 'Temp Delta (ΔT)',        impact: deltaImpact,  baseWeight: 0.09 },
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
}

/* ── Simulate model output ─────────────────────── */
function simulateModel(inputs) {
  const wearScore = inputs.toolWear / 200
  const torqueScore = (inputs.torque - 35) / 30
  const power = (inputs.torque * inputs.rpm) / 95000
  const tempDelta = (inputs.procTemp - inputs.airTemp) - 10.0
  const typeBonus = inputs.machineType === 'H' ? 0.08 : inputs.machineType === 'M' ? 0.03 : -0.04

  const rawScore =
    0.42 * wearScore +
    0.31 * torqueScore +
    0.18 * (power > 1 ? 0.6 : 0.2) +
    0.09 * Math.max(0, tempDelta / 3) +
    typeBonus

  return Math.min(0.98, Math.max(0.04, +(rawScore + (Math.random() - 0.5) * 0.03).toFixed(2)))
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
  machineId: 'M-003',
  machineType: 'M',
  airTemp: 302.2,
  procTemp: 311.9,
  rpm: 2180,
  torque: 56.4,
  toolWear: 154,
}

/* ── 10 Recent Predictions ───────────────────────── */
const SEED_HISTORY = generateRecentPredictions()

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
  useEffect(() => { const t = setTimeout(() => setShow(true), idx * 40); return () => clearTimeout(t) }, [idx])

  return (
    <div className="flex items-center gap-4 transition-all"
      style={{ opacity: show ? 1 : 0, transform: show ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease' }}>
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center gap-0" style={{ minWidth: 16 }}>
        <div className="w-3 h-3 rounded-full shrink-0"
          style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}80`, animation: item.prob >= 0.7 ? 'livePulse 2s infinite' : undefined }} />
        {idx < 9 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.08)', height: 28 }} />}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl mb-2 flex-wrap gap-2"
        style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}>
        <div className="flex items-center gap-3">
          {/* Machine Badge */}
          {item.id && (
            <span className="text-xs font-bold mono px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
              {item.id}
            </span>
          )}
          <div className="flex items-center gap-1.5" style={{ color: '#8892a4', minWidth: 68 }}>
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

        {/* Failure type / action snippet */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#8892a4' }}>
          {item.failureType && (
            <span className="text-xs font-medium" style={{ color: meta.color }}>
              {item.failureType}
            </span>
          )}
          {item.action && (
            <span className="hidden md:inline text-xs" style={{ color: '#8892a4' }}>
              · {item.action}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MACHINE SELECTOR DROPDOWN (6 MACHINES)
   ════════════════════════════════════════════════ */
function MachineDropdown({ selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [])

  const selectedMachine = MACHINES_LIST.find(m => m.id === selectedId) || MACHINES_LIST[0]

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8d3e0' }}>
        <span>Selected Machine: <span className="font-bold mono text-white">{selectedMachine.id}</span> ({selectedMachine.name})</span>
        <ChevronDown size={12} color="#8892a4" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 glass rounded-xl overflow-hidden shadow-2xl">
          {MACHINES_LIST.map(m => (
            <button key={m.id} onClick={() => { onSelect(m); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors"
              style={{ background: m.id === selectedId ? 'rgba(0,212,255,0.12)' : 'transparent', color: m.id === selectedId ? '#00d4ff' : '#c8d3e0' }}>
              <div className="flex items-center gap-2">
                <span className="font-bold mono text-white">{m.id}</span>
                <span style={{ color: '#8892a4' }}>— {m.name}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: m.status === 'critical' ? 'rgba(255,68,68,0.15)' : m.status === 'warning' ? 'rgba(255,179,0,0.15)' : 'rgba(0,255,136,0.15)',
                  color: m.status === 'critical' ? '#ff4444' : m.status === 'warning' ? '#ffb300' : '#00ff88',
                }}>
                {m.status.toUpperCase()}
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
  const [prob, setProb] = useState(0.68)
  const [loading, setLoading] = useState(false)
  const [shap, setShap] = useState(() => computeShap(INITIAL_INPUTS))
  const [history, setHistory] = useState(SEED_HISTORY)
  const [useLive, setUseLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [hasRun, setHasRun] = useState(true)
  const liveRef = useRef(null)

  const meta = probLabel(prob)

  /* Update individual field */
  const setField = useCallback((key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }))
  }, [])

  /* Handle machine selection */
  const handleSelectMachine = useCallback((m) => {
    setInputs({
      machineId: m.id,
      machineType: m.type,
      airTemp: m.currentReadings.airTemp,
      procTemp: m.currentReadings.procTemp,
      rpm: m.currentReadings.speed,
      torque: m.currentReadings.torque,
      toolWear: m.currentReadings.toolWear,
    })
    const simProb = simulateModel({
      ...m.currentReadings,
      machineType: m.type,
      rpm: m.currentReadings.speed,
    })
    setProb(simProb)
    setShap(computeShap({
      ...m.currentReadings,
      machineType: m.type,
      rpm: m.currentReadings.speed,
    }))
  }, [])

  /* Live data feed (Every 3 seconds) */
  useEffect(() => {
    if (!useLive) { if (liveRef.current) clearInterval(liveRef.current); return }
    liveRef.current = setInterval(() => {
      setInputs(prev => {
        const nextAir = clamp(+(prev.airTemp + (Math.random() - 0.5) * 0.3).toFixed(1), 295.0, 305.0)
        const nextProc = clamp(+(prev.procTemp + (Math.random() - 0.5) * 0.25).toFixed(1), 308.0, 313.0)
        const nextRpm = clamp(Math.round(prev.rpm + (Math.random() - 0.5) * 40), 1200, 2800)
        const nextTorque = clamp(+(prev.torque + (Math.random() - 0.5) * 1.1).toFixed(1), 35.0, 65.0)
        const nextWear = clamp(prev.toolWear + (Math.random() < 0.3 ? 1 : 0), 0, 200)

        const updated = {
          ...prev,
          airTemp: nextAir,
          procTemp: nextProc,
          rpm: nextRpm,
          torque: nextTorque,
          toolWear: nextWear,
        }

        const newProb = simulateModel(updated)
        setProb(newProb)
        setShap(computeShap(updated))
        setLastUpdated(new Date())

        return updated
      })
    }, 3000)
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

          {/* Machine selector (6 machines) */}
          <div className="pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <MachineDropdown selectedId={inputs.machineId} onSelect={handleSelectMachine} />
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
