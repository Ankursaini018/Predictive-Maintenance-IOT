import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import LiveSensors from './pages/LiveSensors'
import Predictions from './pages/Predictions'
import FeatureAnalysis from './pages/FeatureAnalysis'
import ModelPerformance from './pages/ModelPerformance'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0a0f1e' }}>
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/live-sensors" element={<LiveSensors />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/feature-analysis" element={<FeatureAnalysis />} />
              <Route path="/model-performance" element={<ModelPerformance />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
