import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Teams from './components/Teams'
import Players from './components/Players'
import Bouts from './components/Bouts'
import LiveStatTracker from './components/LiveStatTracker'
import { Auth } from './components/Auth'
import { ConfigurationError } from './components/ConfigurationError'
import { useAuth } from './hooks/useAuth'
import { isSupabaseConfigured } from './lib/supabase'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/react'


type ActiveView = 'dashboard' | 'players' | 'bouts' | 'teams' | 'settings' | 'live-track'

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [selectedBoutId, setSelectedBoutId] = useState<string | null>(null)

  // Always call hooks first (React hooks rules)
  const { user, loading } = useAuth()
  
  const handleStartLiveTracking = (boutId: string) => {
    setSelectedBoutId(boutId)
    setActiveView('live-track')
  }

  // Check for configuration errors early - if Supabase is not configured, show error
  if (!isSupabaseConfigured) {
    return <ConfigurationError error="Missing Supabase environment variables" />
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
          {activeView === 'bouts' && <Bouts onStartLiveTracking={handleStartLiveTracking} />}
          {activeView === 'teams' && <Teams />}
          {activeView === 'live-track' && <LiveStatTracker boutId={selectedBoutId} />}
          {activeView === 'settings' && <div className="view-placeholder">Settings - Coming Soon</div>}
          <Analytics />
          <SpeedInsights />
        </main>
      </div>
    </div>
  )
}

export default App
