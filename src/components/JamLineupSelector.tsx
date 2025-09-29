import { useState } from 'react'
import type { ExtendedPlayer } from '../types'
import './JamLineupSelector.css'

interface JamLineupSelectorProps {
  homeTeamPlayers: ExtendedPlayer[]
  awayTeamPlayers: ExtendedPlayer[]
  onStartJam: (homeLineup: ExtendedPlayer[], awayLineup: ExtendedPlayer[]) => void
  onCancel: () => void
  currentJam: number
}

const JamLineupSelector: React.FC<JamLineupSelectorProps> = ({
  homeTeamPlayers,
  awayTeamPlayers,
  onStartJam,
  onCancel,
  currentJam
}) => {
  const [homeLineup, setHomeLineup] = useState<ExtendedPlayer[]>([])
  const [awayLineup, setAwayLineup] = useState<ExtendedPlayer[]>([])

  const togglePlayerInLineup = (player: ExtendedPlayer, isHomeTeam: boolean) => {
    if (isHomeTeam) {
      if (homeLineup.find(p => p.id === player.id)) {
        setHomeLineup(homeLineup.filter(p => p.id !== player.id))
      } else if (homeLineup.length < 5) {
        setHomeLineup([...homeLineup, player])
      }
    } else {
      if (awayLineup.find(p => p.id === player.id)) {
        setAwayLineup(awayLineup.filter(p => p.id !== player.id))
      } else if (awayLineup.length < 5) {
        setAwayLineup([...awayLineup, player])
      }
    }
  }

  const canStartJam = homeLineup.length > 0 && awayLineup.length > 0

  const getPositionEmoji = (position: string) => {
    switch (position) {
      case 'jammer': return '⚡'
      case 'pivot': return '🔺'
      case 'blocker': return '🛡️'
      default: return '❓'
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'jammer': return '#e74c3c'
      case 'pivot': return '#f39c12'
      case 'blocker': return '#3498db'
      default: return '#95a5a6'
    }
  }

  return (
    <div className="jam-lineup-selector">
      <div className="selector-header">
        <h2>Select Jam #{currentJam} Lineup</h2>
        <p>Select up to 5 players per team to start the jam.</p>
      </div>

      <div className="teams-selection">
        <div className="team-selection">
          <h3>Home Team ({homeLineup.length}/5)</h3>
          <div className="lineup-display">
            {homeLineup.map(player => (
              <span key={player.id} className="lineup-player" style={{backgroundColor: getPositionColor(player.position || 'Unknown')}}>
                {getPositionEmoji(player.position || 'Unknown')} #{player.team_number}
              </span>
            ))}
          </div>
          <div className="available-players">
            {homeTeamPlayers.length > 0 ? (
              homeTeamPlayers.map(player => {
                const isSelected = homeLineup.find(p => p.id === player.id)
                const canSelect = !isSelected && homeLineup.length < 5
                return (
                  <button
                    key={player.id}
                    className={`player-option ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`}
                    onClick={() => togglePlayerInLineup(player, true)}
                    disabled={!canSelect && !isSelected}
                  >
                    <div className="player-info">
                      <span className="position-indicator" style={{backgroundColor: getPositionColor(player.position || 'Unknown')}}>
                        {getPositionEmoji(player.position || 'Unknown')}
                      </span>
                      <div className="player-details">
                        <span className="player-number">#{player.team_number}</span>
                        <span className="player-name">{player.derby_name}</span>
                        <span className="player-position">{player.position || 'Unknown'}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="no-players">No active players found</div>
            )}
            {homeTeamPlayers.length > 6 && (
              <div className="scroll-hint">👆 Scroll to see all players</div>
            )}
          </div>
        </div>

        <div className="team-selection">
          <h3>Away Team ({awayLineup.length}/5)</h3>
          <div className="lineup-display">
            {awayLineup.map(player => (
              <span key={player.id} className="lineup-player" style={{backgroundColor: getPositionColor(player.position || 'Unknown')}}>
                {getPositionEmoji(player.position || 'Unknown')} #{player.team_number}
              </span>
            ))}
          </div>
          <div className="available-players">
            {awayTeamPlayers.length > 0 ? (
              awayTeamPlayers.map(player => {
                const isSelected = awayLineup.find(p => p.id === player.id)
                const canSelect = !isSelected && awayLineup.length < 5
                return (
                  <button
                    key={player.id}
                    className={`player-option ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`}
                    onClick={() => togglePlayerInLineup(player, false)}
                    disabled={!canSelect && !isSelected}
                  >
                    <div className="player-info">
                      <span className="position-indicator" style={{backgroundColor: getPositionColor(player.position || 'Unknown')}}>
                        {getPositionEmoji(player.position || 'Unknown')}
                      </span>
                      <div className="player-details">
                        <span className="player-number">#{player.team_number}</span>
                        <span className="player-name">{player.derby_name}</span>
                        <span className="player-position">{player.position || 'Unknown'}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="no-players">No active players found</div>
            )}
            {awayTeamPlayers.length > 6 && (
              <div className="scroll-hint">👆 Scroll to see all players</div>
            )}
          </div>
        </div>
      </div>

      <div className="selector-actions">
        {currentJam > 1 && (
          <button className="cancel-btn" onClick={onCancel}>
            Back to Previous Jam
          </button>
        )}
        <button 
          className="start-jam-btn" 
          onClick={() => onStartJam(homeLineup, awayLineup)}
          disabled={!canStartJam}
        >
          Start Jam #{currentJam}
        </button>
      </div>

      {!canStartJam && (
        <div className="validation-message">
          Both teams must have at least 1 player to start the jam.
        </div>
      )}
    </div>
  )
}

export default JamLineupSelector