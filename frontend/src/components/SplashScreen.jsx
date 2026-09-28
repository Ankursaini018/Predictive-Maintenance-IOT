import { useState, useEffect } from 'react'
import { Zap, Activity, Cpu, ShieldCheck } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Initializing IoT telemetry gateway...')
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Stage 1: Progress increments smoothly over ~1.8 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.floor(Math.random() * 8) + 4
        if (next >= 100) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, 60)

    // Stage 2: Dynamic status messages
    const t1 = setTimeout(() => setStatusText('Loading LightGBM model weights (Macro F1: 0.87)...'), 500)
    const t2 = setTimeout(() => setStatusText('Calibrating sensor stream thresholds & SHAP explainers...'), 1100)
    const t3 = setTimeout(() => setStatusText('System operational · Welcome to Infotact Solutions'), 1600)

    // Stage 3: Fade out after 2 seconds
    const tFade = setTimeout(() => {
      setFading(true)
    }, 2000)

    // Stage 4: Unmount completely after fade transition (2.4s)
    const tDone = setTimeout(() => {
      onComplete?.()
    }, 2450)

    return () => {
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(tFade)
      clearTimeout(tDone)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #0d1527 0%, #060913 70%, #03050a 100%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Background glow orb */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, rgba(192,132,252,0.06) 40%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />

      <div className="relative flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Company Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 tracking-wider uppercase"
          style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.25)',
            color: '#00d4ff',
            boxShadow: '0 0 16px rgba(0,212,255,0.15)',
          }}
        >
          <ShieldCheck size={13} />
          <span>Infotact Solutions</span>
        </div>

        {/* Animated Brand Icon */}
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(192,132,252,0.2) 100%)',
              border: '1px solid rgba(0,212,255,0.4)',
              boxShadow: '0 0 30px rgba(0,212,255,0.3), inset 0 0 15px rgba(0,212,255,0.2)',
            }}
          >
            <Zap size={36} color="#00d4ff" className="animate-pulse" />
          </div>

          {/* Radiating pulsing rings */}
          <div
            className="absolute -inset-3 rounded-3xl pointer-events-none"
            style={{
              border: '1px solid rgba(0,212,255,0.2)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {/* Project Titles */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
          PredictIQ
        </h1>
        <p className="text-sm font-medium mb-8" style={{ color: '#00d4ff' }}>
          Predictive Maintenance IoT Dashboard
        </p>

        {/* Loading Progress Bar Container */}
        <div className="w-full space-y-3">
          <div
            className="w-full h-2 rounded-full overflow-hidden relative"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Animated Loading Bar */}
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00d4ff 0%, #00ff88 60%, #fbbf24 100%)',
                boxShadow: '0 0 12px rgba(0,212,255,0.7)',
              }}
            />
          </div>

          {/* Progress Percent and Status */}
          <div className="flex items-center justify-between text-xs px-0.5">
            <span
              className="text-[11px] truncate max-w-[80%]"
              style={{ color: '#8892a4' }}
            >
              {statusText}
            </span>
            <span className="mono font-bold text-xs" style={{ color: '#00d4ff' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Sub-footer details */}
        <div className="mt-8 flex items-center gap-4 text-[11px]" style={{ color: '#8892a4' }}>
          <span className="flex items-center gap-1.5">
            <Activity size={12} color="#00ff88" /> IoT Sensors
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Cpu size={12} color="#c084fc" /> LightGBM v1.0
          </span>
        </div>
      </div>
    </div>
  )
}
