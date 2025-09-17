import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Teams from './components/Teams'
import Players from './components/Players'
import Bouts from './components/Bouts'
import { Auth } from './components/Auth'
import { useAuth } from './hooks/useAuth'
import { Analytics } from "@vercel/analytics/react"


type ActiveView = 'dashboard' | 'players' | 'bouts' | 'teams' | 'settings'

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const { user, loading } = useAuth()

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
