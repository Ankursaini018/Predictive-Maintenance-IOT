/**
 * Shared Realistic Mock Data & Live Dynamic Generator
 * IoT Predictive Maintenance System
 */

// ── Strict Sensor Operating Ranges ──────────────────────────────────────────
export const SENSOR_RANGES = {
  airTemp:  { min: 295, max: 305, unit: 'K',   label: 'Air Temperature',     base: 299.8, step: 0.1, warn: 303.0, crit: 304.5 },
  procTemp: { min: 308, max: 313, unit: 'K',   label: 'Process Temperature', base: 310.4, step: 0.1, warn: 312.0, crit: 312.8 },
  torque:   { min: 35,  max: 65,  unit: 'Nm',  label: 'Torque',              base: 48.2,  step: 0.5, warn: 58.0,  crit: 62.5  },
  speed:    { min: 1200, max: 2800, unit: 'RPM', label: 'Rotational Speed', base: 1780,  step: 10,  warn: 2400,  crit: 2650  },
  toolWear: { min: 0,   max: 200, unit: 'min', label: 'Tool Wear',           base: 86,    step: 1,   warn: 160,   crit: 185   },
}

// ── Clamp utility ───────────────────────────────────────────────────────────
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// ── Helper to format time HH:mm:ss ──────────────────────────────────────────
export function formatTime(date = new Date()) {
  return date.toTimeString().split(' ')[0]
}

// ── 60-Data-Point Sensor History Generator ──────────────────────────────────
export function generateSensorHistory(count = 60) {
  const points = []
  const now = Date.now()
  const intervalMs = 3000 // 3 seconds interval per point

  // Base state with continuous harmonic drift
  let air = 299.5
  let proc = 310.2
  let torq = 47.5
  let spd = 1750
  let wear = 65

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalMs)
    const timeStr = timestamp.toTimeString().split(' ')[0]

    // Realistic continuous wandering with smooth sin/cos & bounded noise
    const tNorm = (count - i) / 10
    air = clamp(299.8 + Math.sin(tNorm * 0.8) * 2.8 + (Math.random() - 0.5) * 0.4, 295.0, 305.0)
    proc = clamp(310.4 + Math.sin(tNorm * 0.7 + 0.5) * 1.6 + (Math.random() - 0.5) * 0.3, 308.0, 313.0)
    torq = clamp(48.0 + Math.cos(tNorm * 1.1) * 9.5 + (Math.random() - 0.5) * 1.5, 35.0, 65.0)
    spd = clamp(Math.round(1800 + Math.sin(tNorm * 0.9) * 450 + (Math.random() - 0.5) * 60), 1200, 2800)
    wear = clamp(Math.round(wear + (Math.random() > 0.4 ? 0.3 : 0)), 0, 200)

    points.push({
      index: count - i,
      time: timeStr,
      airTemp: +air.toFixed(1),
      procTemp: +proc.toFixed(1),
      torque: +torq.toFixed(1),
      speed: Math.round(spd),
      toolWear: Math.round(wear),
      // Normalized / scaled values for compact composite chart visualization
      tempDelta: +(proc - air).toFixed(1),
      speedScaled: +(spd / 40).toFixed(1),
      toolWearScaled: +(wear / 2).toFixed(1),
    })
  }

  return points
}

// ── Live sensor variation generator (Every 3 seconds) ──────────────────────
export function driftSensorPoint(lastPoint, nextIndex) {
  const now = new Date()
  const timeStr = now.toTimeString().split(' ')[0]

  // Add realistic small random walk variation
  const dAir = (Math.random() - 0.5) * 0.3
  const dProc = (Math.random() - 0.5) * 0.25
  const dTorque = (Math.random() - 0.5) * 1.2
  const dSpeed = (Math.random() - 0.5) * 45
  const dWear = Math.random() < 0.3 ? 1 : 0 // increases occasionally

  const airTemp = clamp(+(lastPoint.airTemp + dAir).toFixed(1), 295.0, 305.0)
  const procTemp = clamp(+(lastPoint.procTemp + dProc).toFixed(1), 308.0, 313.0)
  const torque = clamp(+(lastPoint.torque + dTorque).toFixed(1), 35.0, 65.0)
  const speed = clamp(Math.round(lastPoint.speed + dSpeed), 1200, 2800)
  let toolWear = lastPoint.toolWear + dWear
  if (toolWear > 200) toolWear = 0 // auto reset upon tool maintenance replacement

  return {
    index: nextIndex || (lastPoint.index + 1),
    time: timeStr,
    airTemp,
    procTemp,
    torque,
    speed,
    toolWear,
    tempDelta: +(procTemp - airTemp).toFixed(1),
    speedScaled: +(speed / 40).toFixed(1),
    toolWearScaled: +(toolWear / 2).toFixed(1),
  }
}

// ── 6 Machines with Exact IDs & Random Statuses ─────────────────────────────
export const INITIAL_MACHINES = [
  {
    id: 'L-001',
    name: 'CNC Lathe Unit 1',
    type: 'L',
    status: 'normal',
    healthScore: 94,
    power: '4.2 kW',
    currentReadings: { airTemp: 298.6, procTemp: 309.8, torque: 42.1, speed: 1650, toolWear: 48 },
    readings: [32, 34, 31, 35, 33, 36, 34, 35],
  },
  {
    id: 'L-002',
    name: 'CNC Lathe Unit 2',
    type: 'L',
    status: 'normal',
    healthScore: 89,
    power: '4.6 kW',
    currentReadings: { airTemp: 299.4, procTemp: 310.1, torque: 44.5, speed: 1720, toolWear: 72 },
    readings: [28, 29, 31, 30, 32, 33, 31, 34],
  },
  {
    id: 'M-003',
    name: 'Milling Center A',
    type: 'M',
    status: 'warning',
    healthScore: 68,
    power: '8.4 kW',
    currentReadings: { airTemp: 302.2, procTemp: 311.9, torque: 56.4, speed: 2180, toolWear: 154 },
    readings: [62, 65, 68, 67, 72, 70, 74, 73],
  },
  {
    id: 'M-004',
    name: 'Milling Center B',
    type: 'M',
    status: 'normal',
    healthScore: 91,
    power: '7.8 kW',
    currentReadings: { airTemp: 298.9, procTemp: 309.5, torque: 41.8, speed: 1590, toolWear: 55 },
    readings: [22, 24, 21, 25, 23, 22, 26, 24],
  },
  {
    id: 'H-005',
    name: 'Heavy Hydraulic Press',
    type: 'H',
    status: 'critical',
    healthScore: 38,
    power: '16.5 kW',
    currentReadings: { airTemp: 304.6, procTemp: 312.8, torque: 63.8, speed: 2620, toolWear: 192 },
    readings: [88, 91, 94, 92, 97, 95, 98, 99],
  },
  {
    id: 'H-006',
    name: 'Heavy High-Load Forge',
    type: 'H',
    status: 'warning',
    healthScore: 64,
    power: '14.9 kW',
    currentReadings: { airTemp: 301.8, procTemp: 311.5, torque: 58.2, speed: 2340, toolWear: 142 },
    readings: [55, 59, 62, 60, 65, 63, 68, 67],
  },
]

// ── 10 Recent Predictions Table Data ────────────────────────────────────────
export function generateRecentPredictions() {
  const now = Date.now()
  return [
    {
      id: 'H-005',
      type: 'H',
      time: new Date(now - 1 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.94,
      status: 'Critical',
      badge: 'Failure',
      failureType: 'Tool Wear Failure (TWF)',
      sensorSnapshot: { airTemp: 304.6, procTemp: 312.8, torque: 63.8, speed: 2620, toolWear: 192 },
      action: 'Emergency Stop & Tool Replacement Required',
    },
    {
      id: 'M-003',
      type: 'M',
      time: new Date(now - 4 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.68,
      status: 'Warning',
      badge: 'Warning',
      failureType: 'Heat Dissipation Failure (HDF)',
      sensorSnapshot: { airTemp: 302.2, procTemp: 311.9, torque: 56.4, speed: 2180, toolWear: 154 },
      action: 'Inspect Coolant Flow & Reduce Operational Load',
    },
    {
      id: 'H-006',
      type: 'H',
      time: new Date(now - 8 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.62,
      status: 'Warning',
      badge: 'Warning',
      failureType: 'Overstrain Failure (OSF)',
      sensorSnapshot: { airTemp: 301.8, procTemp: 311.5, torque: 58.2, speed: 2340, toolWear: 142 },
      action: 'Check Mechanical Alignment & Torque Calibration',
    },
    {
      id: 'L-001',
      type: 'L',
      time: new Date(now - 12 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.12,
      status: 'Normal',
      badge: 'Normal',
      failureType: 'None (Healthy)',
      sensorSnapshot: { airTemp: 298.6, procTemp: 309.8, torque: 42.1, speed: 1650, toolWear: 48 },
      action: 'Normal Routine Operation - No Intervention',
    },
    {
      id: 'M-004',
      type: 'M',
      time: new Date(now - 17 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.15,
      status: 'Normal',
      badge: 'Normal',
      failureType: 'None (Healthy)',
      sensorSnapshot: { airTemp: 298.9, procTemp: 309.5, torque: 41.8, speed: 1590, toolWear: 55 },
      action: 'Normal Routine Operation - No Intervention',
    },
    {
      id: 'L-002',
      type: 'L',
      time: new Date(now - 22 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.18,
      status: 'Normal',
      badge: 'Normal',
      failureType: 'None (Healthy)',
      sensorSnapshot: { airTemp: 299.4, procTemp: 310.1, torque: 44.5, speed: 1720, toolWear: 72 },
      action: 'Normal Routine Operation - No Intervention',
    },
    {
      id: 'H-005',
      type: 'H',
      time: new Date(now - 29 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.88,
      status: 'Critical',
      badge: 'Failure',
      failureType: 'Power Failure (PWF)',
      sensorSnapshot: { airTemp: 303.9, procTemp: 312.4, torque: 62.1, speed: 2580, toolWear: 184 },
      action: 'Check Voltage Stability & Power Draw Limits',
    },
    {
      id: 'M-003',
      type: 'M',
      time: new Date(now - 36 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.54,
      status: 'Warning',
      badge: 'Warning',
      failureType: 'Tool Wear Threshold Warning',
      sensorSnapshot: { airTemp: 301.2, procTemp: 311.2, torque: 52.8, speed: 2050, toolWear: 148 },
      action: 'Schedule Tool Bit Replacement During Next Shift',
    },
    {
      id: 'L-001',
      type: 'L',
      time: new Date(now - 45 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.08,
      status: 'Normal',
      badge: 'Normal',
      failureType: 'None (Healthy)',
      sensorSnapshot: { airTemp: 297.8, procTemp: 309.2, torque: 39.5, speed: 1610, toolWear: 42 },
      action: 'Normal Routine Operation - No Intervention',
    },
    {
      id: 'L-002',
      type: 'L',
      time: new Date(now - 55 * 60 * 1000).toTimeString().split(' ')[0],
      prob: 0.09,
      status: 'Normal',
      badge: 'Normal',
      failureType: 'None (Healthy)',
      sensorSnapshot: { airTemp: 298.1, procTemp: 309.4, torque: 40.2, speed: 1680, toolWear: 64 },
      action: 'Normal Routine Operation - No Intervention',
    },
  ]
}

// ── Top 10 SHAP Features with Exact Values Required ─────────────────────────
// Tool Wear highest (0.42), Torque second (0.31), Factory Load third (0.18)
export const SHAP_TOP_10 = [
  { rank: 1,  name: 'Tool Wear [min]',            importance: 0.42, category: 'sensor',     color: '#fbbf24', highlight: true,  desc: 'Primary wear indicator across cumulative cutting cycles' },
  { rank: 2,  name: 'Torque [Nm]',                importance: 0.31, category: 'sensor',     color: '#00d4ff', highlight: true,  desc: 'Instantaneous spindle rotational resistance force' },
  { rank: 3,  name: 'Factory Load',               importance: 0.18, category: 'external',   color: '#a78bfa', highlight: true,  desc: 'Plant-wide grid capacity and ambient demand ratio' },
  { rank: 4,  name: 'Power (Torque × Speed)',     importance: 0.12, category: 'engineered', color: '#ffb300', highlight: false, desc: 'Calculated mechanical dissipation energy (W)' },
  { rank: 5,  name: 'Temperature Delta (ΔT)',     importance: 0.09, category: 'engineered', color: '#ffb300', highlight: false, desc: 'Difference between Process and Air Temperature' },
  { rank: 6,  name: 'Rotational Speed [rpm]',     importance: 0.07, category: 'sensor',     color: '#00d4ff', highlight: false, desc: 'Spindle motor rotation velocity' },
  { rank: 7,  name: 'Tool Wear Rate',             importance: 0.05, category: 'engineered', color: '#ffb300', highlight: false, desc: 'Rate of wear accumulation per 100 operating cycles' },
  { rank: 8,  name: 'Torque Rolling Mean',        importance: 0.04, category: 'rolling',    color: '#c084fc', highlight: false, desc: '10-reading moving average of torque readings' },
  { rank: 9,  name: 'Machine Type (H/M/L)',       importance: 0.03, category: 'categorical',color: '#00ff88', highlight: false, desc: 'Duty cycle class: Low, Medium, or Heavy rating' },
  { rank: 10, name: 'Air Temperature [K]',        importance: 0.02, category: 'sensor',     color: '#00d4ff', highlight: false, desc: 'Ambient factory floor temperature' },
]

// ── Model Performance Global Metrics ────────────────────────────────────────
export const MODEL_METRICS = {
  macroF1: 0.87,
  precision: 0.84,
  recall: 0.89,
  aucRoc: 0.94,
  accuracy: 0.978,
  algorithm: 'LightGBM Classifier v1.0',
  cvMethod: 'Stratified 5-Fold Cross-Validation',
  trainingDate: 'September 2026',
}
