import React from 'react'
import { requireSupabase } from '../lib/supabase'
import './ModeSelector.css'

interface ModeSelectorProps {
  onSelectManual: () => void
  onSelectLive: () => void
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectManual, onSelectLive }) => {
  const handleSignOut = async () => {
    try {
      await requireSupabase().auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="mode-selector-container">
      <div className="mode-selector-topbar">
        <div className="mode-selector-brand">
          <span className="mode-selector-logo">🛼</span>
          <span className="mode-selector-title">Derby Stat Tracker</span>
        </div>
        <button className="mode-sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="mode-selector-body">
        <div className="mode-selector-header">
          <h1 className="mode-selector-heading">Choose Your Mode</h1>
          <p className="mode-selector-subheading">
            How would you like to track this bout?
          </p>
        </div>

        <div className="mode-cards">
          <div className="mode-card mode-card--manual" onClick={onSelectManual}>
            <div className="mode-card-icon">📊</div>
            <div className="mode-card-content">
              <h2 className="mode-card-title">Manual Stat Tracking</h2>
              <p className="mode-card-description">
                Track jams, lineups and scores manually during a bout
              </p>
              <ul className="mode-card-features">
                <li>Log jams and penalties in real time</li>
                <li>Manage player lineups per jam</li>
                <li>Full bout history &amp; stats dashboard</li>
              </ul>
            </div>
            <button
              className="mode-card-btn mode-card-btn--manual"
              onClick={(e) => { e.stopPropagation(); onSelectManual() }}
            >
              Start Manual Tracking →
            </button>
          </div>

          <div className="mode-card mode-card--live" onClick={onSelectLive}>
            <div className="mode-card-icon">📡</div>
            <div className="mode-card-content">
              <h2 className="mode-card-title">Live from Scoreboard</h2>
              <p className="mode-card-description">
                Read live data directly from your CRG scoreboard
              </p>
              <ul className="mode-card-features">
                <li>Auto-sync score &amp; jam data</li>
                <li>Real-time scoreboard overlay</li>
                <li>Connects to CRG ScoreBoard API</li>
              </ul>
            </div>
            <button
              className="mode-card-btn mode-card-btn--live"
              onClick={(e) => { e.stopPropagation(); onSelectLive() }}
            >
              Connect to Scoreboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModeSelector
