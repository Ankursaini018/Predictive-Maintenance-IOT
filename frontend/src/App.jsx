import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import LiveSensors from './pages/LiveSensors'
import Predictions from './pages/Predictions'
import FeatureAnalysis from './pages/FeatureAnalysis'
import ModelPerformance from './pages/ModelPerformance'

/* Re-trigger page-enter on route change */
function AnimatedRoutes() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    el.style.animation = 'none'
    // Force reflow
    void el.offsetHeight
    el.style.animation = ''
  }, [pathname])

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto p-5 page-enter"
      style={{ scrollbarGutter: 'stable' }}
    >
      <Routes>
        <Route path="/"                element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/live-sensors"    element={<LiveSensors />} />
        <Route path="/predictions"     element={<Predictions />} />
        <Route path="/feature-analysis" element={<FeatureAnalysis />} />
        <Route path="/model-performance" element={<ModelPerformance />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-grid">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <Header />
            <AnimatedRoutes />
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
