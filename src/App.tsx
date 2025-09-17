import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Teams from './components/Teams'
import Players from './components/Players'
import Bouts from './components/Bouts'
import { Auth } from './components/Auth'
import { ConfigurationError } from './components/ConfigurationError'
import { useAuth } from './hooks/useAuth'
import { Analytics } from "@vercel/analytics/react"


type ActiveView = 'dashboard' | 'players' | 'bouts' | 'teams' | 'settings'

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [configError, setConfigError] = useState<string | null>(null)

  // Always call hooks first
  const { user, loading } = useAuth()

  // Check for configuration errors early
  useEffect(() => {
    try {
      // Try to access environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setConfigError('Missing Supabase environment variables')
        return
      }
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Configuration error')
    }
  }, [])

  // Show configuration error if detected
  if (configError) {
    return <ConfigurationError error={configError} />
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Loading Derby Stat Tracker...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth onAuthSuccess={() => { }} />
  }

  return (
    <div className="app">
      <Header />
      <div className="app-container">
        <Navigation activeView={activeView} onViewChange={setActiveView} />
        <main className="main-content">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'players' && <Players />}
          {activeView === 'bouts' && <Bouts />}
          {activeView === 'teams' && <Teams />}
          {activeView === 'settings' && <div className="view-placeholder">Settings - Coming Soon</div>}
          <Analytics />
        </main>
      </div>
    </div>
  )
}

export default App
