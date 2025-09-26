import { useState } from 'react'
import type { Player, PlayerStats } from '../lib/supabase'
import StatButton from './StatButton'
import './PlayerStatCard.css'

interface ExtendedPlayer extends Player {
  position?: string
  team_number?: string
  is_active?: boolean
  team_id?: string
}

interface PlayerStatCardProps {
  player: ExtendedPlayer
  stats?: PlayerStats
  onStatUpdate: (statType: keyof PlayerStats, delta: number) => void
  isJamActive: boolean
}

const PlayerStatCard: React.FC<PlayerStatCardProps> = ({
  player,
  stats,
  onStatUpdate,
  isJamActive
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pivotHasStar, setPivotHasStar] = useState(false)


  
  const handleLeadJammerToggle = () => {
    const currentValue = stats?.lead_jammer || 0
    onStatUpdate('lead_jammer', currentValue > 0 ? -currentValue : 1)
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'jammer':
        return '#ff6b6b'
      case 'pivot':
        return '#4ecdc4'
      case 'blocker':
        return '#45b7d1'
      default:
        return '#95a5a6'
    }
  }



  return (
    <div 
      className={`player-stat-card ${isExpanded ? 'expanded' : ''} ${isJamActive ? 'jam-active' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Player Header */}
      <div className="player-header">
        <div className="player-info-inline">
          <span className="player-number">#{player.team_number || player.preferred_number}</span>
          <span className="player-name">{player.derby_name}</span>
          <span 
            className="player-position"
            style={{ backgroundColor: getPositionColor(player.position || 'Unknown') }}
          >
            {player.position || 'Unknown'}
          </span>
        </div>
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="stat-value">{stats?.jams_played || 0}</span>
            <span className="stat-label">Jams</span>
          </div>
          <div className="quick-stat">
            {player.position === 'blocker' ? (
              <>
                <span className="stat-value">{stats?.blocks || 0}</span>
                <span className="stat-label">Blks</span>
              </>
            ) : (
              <>
                <span className="stat-value">{stats?.points_scored || 0}</span>
                <span className="stat-label">Pts</span>
              </>
            )}
          </div>
          <div className="quick-stat">
            <span className="stat-value">{stats?.assists || 0}</span>
            <span className="stat-label">Ast</span>
          </div>
          <div className="quick-stat">
            <span className="stat-value">{stats?.penalties || 0}</span>
            <span className="stat-label">Pen</span>
          </div>
        </div>
      </div>

      {/* Expanded Stats Panel */}
      {isExpanded && (
        <div className="stats-panel" onClick={(e) => e.stopPropagation()}>
          
          {/* Jammer Stats */}
          {player.position === 'jammer' && (
            <div className="stat-category">
              <div className="stat-buttons">
                <StatButton
                  label="Points"
                  value={stats?.points_scored || 0}
                  onIncrement={() => onStatUpdate('points_scored', 1)}
                  onDecrement={() => onStatUpdate('points_scored', -1)}
                  color="#27ae60"
                  icon="🏆"
                  disabled={!isJamActive}
                />
                <div className="lead-jammer-toggle">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={(stats?.lead_jammer || 0) > 0}
                      onChange={handleLeadJammerToggle}
                      disabled={!isJamActive}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">Lead</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Pivot Stats */}
          {player.position === 'pivot' && (
            <div className="stat-category">
              <div className="stat-buttons">
                {pivotHasStar && (
                  <StatButton
                    label="Points"
                    value={stats?.points_scored || 0}
                    onIncrement={() => onStatUpdate('points_scored', 1)}
                    onDecrement={() => onStatUpdate('points_scored', -1)}
                    color="#27ae60"
                    icon="🏆"
                    disabled={!isJamActive}
                  />
                )}
                <div className="lead-jammer-toggle">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={pivotHasStar}
                      onChange={() => setPivotHasStar(!pivotHasStar)}
                      disabled={!isJamActive}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">Has Star</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* All Positions - Defensive Stats */}
          <div className="stat-category">
            <div className="stat-buttons">
              <StatButton
                label="Blocks"
                value={stats?.blocks || 0}
                onIncrement={() => onStatUpdate('blocks', 1)}
                onDecrement={() => onStatUpdate('blocks', -1)}
                color="#3498db"
                icon="🛡️"
                disabled={!isJamActive}
              />
              <StatButton
                label="Assists"
                value={stats?.assists || 0}
                onIncrement={() => onStatUpdate('assists', 1)}
                onDecrement={() => onStatUpdate('assists', -1)}
                color="#9b59b6"
                icon="🤝"
                disabled={!isJamActive}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              className="action-btn penalty-btn"
              onClick={() => onStatUpdate('penalties', 1)}
            >
              Add Penalty
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerStatCard