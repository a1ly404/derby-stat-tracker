import React, { useState, useEffect } from 'react'
import type { Bout, Team } from '../lib/supabase'
import './LiveBoutHeader.css'

interface LiveBoutHeaderProps {
  bout: Bout & {
    home_team: Team
    away_team: Team
  }
  currentJam: number
  isJamActive: boolean
  onStartJam: () => void
  onEndJam: () => void
  onEndBout: () => void
}

const LiveBoutHeader: React.FC<LiveBoutHeaderProps> = ({
  bout,
  currentJam,
  isJamActive,
  onStartJam,
  onEndJam,
  onEndBout
}) => {
  const [timeRemaining, setTimeRemaining] = useState(120) // 2 minutes = 120 seconds

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isJamActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            onEndJam() // Auto-end jam when timer reaches 0
            return 120 // Reset for next jam
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isJamActive, timeRemaining, onEndJam])

  const handleStartJam = () => {
    setTimeRemaining(120) // Reset timer to 2 minutes
    onStartJam()
  }

  const handleEndJam = () => {
    setTimeRemaining(120) // Reset timer for next jam
    onEndJam()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="live-bout-header">
      <div className="header-content">
        <div className="bout-basic-info">
          <span className="teams-summary">{bout.home_team.name} vs {bout.away_team.name}</span>
          <span className="scores">{bout.home_score || 0} - {bout.away_score || 0}</span>
        </div>
        
        <div className="jam-controls">
          <div className="jam-info">
            <span className="jam-number">Jam #{currentJam}</span>
            <div className="jam-timer">{formatTime(timeRemaining)}</div>
            <span className={`status-dot ${isJamActive ? 'active' : 'inactive'}`}></span>
          </div>
          
          <button 
            className={`jam-btn ${isJamActive ? 'end' : 'start'}`}
            onClick={isJamActive ? handleEndJam : handleStartJam}
          >
            {isJamActive ? 'End' : 'Start'}
          </button>
          
          <button 
            className="bout-end-btn"
            onClick={onEndBout}
          >
            End Bout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiveBoutHeader