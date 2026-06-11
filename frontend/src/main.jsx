import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
          fontFamily: 'sans-serif', padding: 24, background: '#fdf4ff'
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ color: '#7C3AED', margin: 0 }}>Thankeeu failed to load</h1>
          <p style={{ color: '#555', margin: 0 }}>Error: {this.state.error.message}</p>
          <pre style={{
            background: '#fff', border: '1px solid #e0d4f7', borderRadius: 8,
            padding: '12px 16px', fontSize: 12, color: '#333',
            maxWidth: '90vw', overflow: 'auto', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error.stack}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ background: '#7C3AED', color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
