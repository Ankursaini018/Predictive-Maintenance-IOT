import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Breadcrumb from './components/Breadcrumb'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import LiveSensors from './pages/LiveSensors'
import Predictions from './pages/Predictions'
import FeatureAnalysis from './pages/FeatureAnalysis'
import ModelPerformance from './pages/ModelPerformance'
import NotFound from './pages/NotFound'

/* Re-trigger page-enter animation on every route change */
function AnimatedRoutes() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight          // force reflow
    el.style.animation = ''
  }, [pathname])

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto p-5 page-enter"
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Breadcrumb injected globally — shows on all non-home pages */}
      <Breadcrumb />

      <Routes>
        {/* ── Primary routes ── */}
        <Route path="/"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/sensors"     element={<LiveSensors />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/shap"        element={<FeatureAnalysis />} />
        <Route path="/performance" element={<ModelPerformance />} />

        {/* ── Legacy redirects (old URLs → new) ── */}
        <Route path="/live-sensors"      element={<Navigate to="/sensors"     replace />} />
        <Route path="/feature-analysis"  element={<Navigate to="/shap"        replace />} />
        <Route path="/model-performance" element={<Navigate to="/performance"  replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
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
