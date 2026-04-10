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
import ModeSelector from './components/ModeSelector'
import LiveScoreboardView from './components/LiveScoreboardView'
import { useAuth } from './hooks/useAuth'
import { isSupabaseConfigured } from './lib/supabase'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ActiveView } from './types'

function App() {
  // Initial view after auth is the mode selector
  const [activeView, setActiveView] = useState<ActiveView>('mode-select')
  const [selectedBoutId, setSelectedBoutId] = useState<string | null>(null)

  const { user, loading } = useAuth()

  const handleStartLiveTracking = (boutId: string) => {
    setSelectedBoutId(boutId)
    setActiveView('live-track')
  }

  const handleNavigateBackToBouts = () => {
    setSelectedBoutId(null)
    setActiveView('bouts')
  }

  // ── Guard: Supabase not configured ──────────────────────────────────────────
  if (!isSupabaseConfigured) {
    return <ConfigurationError error="Missing Supabase environment variables" />
  }

  // ── Guard: auth loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Loading Derby Stat Tracker...</h2>
        </div>
      </div>
    )
  }

  // ── Guard: not authenticated ─────────────────────────────────────────────────
  if (!user) {
    return <Auth onAuthSuccess={() => { }} />
  }

  // ── Full-screen view: mode selector (post-login landing) ─────────────────────
  if (activeView === 'mode-select') {
    return (
      <ModeSelector
        onSelectManual={() => setActiveView('dashboard')}
        onSelectLive={() => setActiveView('live-scoreboard')}
      />
    )
  }

  // ── Full-screen view: live scoreboard ────────────────────────────────────────
  if (activeView === 'live-scoreboard') {
    return (
      <LiveScoreboardView
        connected={false}
        onBack={() => setActiveView('mode-select')}
      />
    )
  }

  // ── Normal app shell (manual tracking flow) ──────────────────────────────────
  return (
    <div className="app">
      <Header />
      <div className="app-container">
        <Navigation activeView={activeView} onViewChange={setActiveView} />
        <main className="main-content">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'players' && <Players />}
          {activeView === 'bouts' && (
            <Bouts onStartLiveTracking={handleStartLiveTracking} />
          )}
          {activeView === 'teams' && <Teams />}
          {activeView === 'live-track' && (
            <LiveStatTracker
              boutId={selectedBoutId}
              onNavigateBack={handleNavigateBackToBouts}
            />
          )}
          {activeView === 'settings' && (
            <div className="view-placeholder">Settings - Coming Soon</div>
          )}
          <Analytics />
          <SpeedInsights />
        </main>
      </div>
    </div>
  )
}

export default App
