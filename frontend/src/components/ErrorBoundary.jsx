import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('PredictIQ Uncaught Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-grid">
          <div
            className="glass p-8 rounded-2xl max-w-lg w-full text-center space-y-6"
            style={{
              border: '1px solid rgba(255, 68, 68, 0.3)',
              boxShadow: '0 0 35px rgba(255, 68, 68, 0.15)',
            }}
          >
            {/* Warning Icon Badge */}
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 68, 68, 0.12)',
                  border: '1px solid rgba(255, 68, 68, 0.35)',
                }}
              >
                <AlertTriangle size={32} color="#ff4444" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Component Render Error
              </h2>
              <p className="text-xs mt-1" style={{ color: '#8892a4' }}>
                PredictIQ encountered an unexpected issue while rendering this view.
              </p>
            </div>

            {/* Error Message Snippet */}
            {this.state.error && (
              <div
                className="p-3 rounded-xl text-left mono text-[11px] overflow-x-auto max-h-32"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ff8888',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.25) 0%, rgba(0,180,255,0.2) 100%)',
                  border: '1px solid rgba(0,212,255,0.4)',
                  color: '#00d4ff',
                }}
              >
                <RefreshCw size={13} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#c8d3e0',
                }}
              >
                <Home size={13} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
