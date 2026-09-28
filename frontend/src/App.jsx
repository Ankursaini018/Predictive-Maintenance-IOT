import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Breadcrumb from './components/Breadcrumb'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './context/ThemeContext'
import SplashScreen from './components/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'
import PageSkeleton from './components/PageSkeleton'

/* ── Performance Optimization: Lazy Load Page Components ── */
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LiveSensors = lazy(() => import('./pages/LiveSensors'))
const Predictions = lazy(() => import('./pages/Predictions'))
const FeatureAnalysis = lazy(() => import('./pages/FeatureAnalysis'))
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'))
const NotFound = lazy(() => import('./pages/NotFound'))

/* Route to Title mapping: Format 'Page Name | PM Dashboard' */
const ROUTE_PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/sensors': 'Live Sensors',
  '/predictions': 'Predictions',
  '/shap': 'Feature Analysis',
  '/performance': 'Model Performance',
}

/* Re-trigger page-enter animation on route change and update document.title */
function AnimatedRoutes() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    // 2. Add proper page titles: Format: 'Page Name | PM Dashboard'
    const pageName = ROUTE_PAGE_TITLES[pathname] || (pathname === '/' ? 'Dashboard' : 'Page Not Found')
    document.title = `${pageName} | PM Dashboard`

    // Reset and trigger page animation
    const el = mainRef.current
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight // force reflow
    el.style.animation = ''
  }, [pathname])

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto p-4 sm:p-5 page-enter min-w-0"
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Breadcrumb injected globally — shows on all non-home pages */}
      <Breadcrumb />

      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
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
            <Route path="/model-performance" element={<Navigate to="/performance" replace />} />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}

export default function App() {
  // 1. Loading screen on first app load (fades out after 2s)
  const [showSplash, setShowSplash] = useState(true)

  // 5. Responsive mobile menu drawer state
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          {/* First load splash loading screen */}
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}

          <div className="app-shell flex h-screen w-screen overflow-hidden bg-grid relative">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header
                mobileOpen={mobileOpen}
                onToggleMobileMenu={() => setMobileOpen(o => !o)}
              />
              <AnimatedRoutes />
            </div>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
