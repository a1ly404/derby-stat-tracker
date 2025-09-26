import React from 'react'
import type { Bout, Team, Player, PlayerStats } from '../lib/supabase'
import './BoutSummary.css'

interface ExtendedPlayer extends Player {
  position?: string
  team_number?: string
  is_active?: boolean
  team_id?: string
}

interface BoutSummaryProps {
  bout: Bout & {
    home_team: Team
    away_team: Team
  }
  homeTeamPlayers: ExtendedPlayer[]
  awayTeamPlayers: ExtendedPlayer[]
  playerStats: Map<string, PlayerStats>
  onNewBout: () => void
  onBackToBouts: () => void
}

const BoutSummary: React.FC<BoutSummaryProps> = ({
  bout,
  homeTeamPlayers,
  awayTeamPlayers,
  playerStats,
  onNewBout,
  onBackToBouts
}) => {
  const homeScore = bout.home_score || 0
  const awayScore = bout.away_score || 0
  const winningTeam = homeScore > awayScore ? bout.home_team : awayScore > homeScore ? bout.away_team : null

  const getPlayerStats = (playerId: string) => {
    return playerStats.get(playerId) || {
      jams_played: 0,
      lead_jammer: 0,
      points_scored: 0,
      penalties: 0,
      blocks: 0,
      assists: 0
    }
  }

  const PlayerStatsSummary = ({ player }: { player: ExtendedPlayer }) => {
    const stats = getPlayerStats(player.id)
    return (
      <div className="player-summary">
        <div className="player-info">
          <span className="player-number">#{player.team_number || player.preferred_number}</span>
          <span className="player-name">{player.derby_name}</span>
          <span className={`position-badge ${player.position}`}>
            {player.position?.charAt(0).toUpperCase() || 'B'}
          </span>
        </div>
        <div className="player-detailed-stats">
          <div className="stat-item">
            <span className="stat-label">Jams:</span>
            <span className="stat-value">{stats.jams_played}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Points:</span>
            <span className="stat-value">{stats.points_scored}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Lead Jammer:</span>
            <span className="stat-value">{stats.lead_jammer}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Penalties:</span>
            <span className="stat-value">{stats.penalties}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Blocks:</span>
            <span className="stat-value">{stats.blocks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Assists:</span>
            <span className="stat-value">{stats.assists}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bout-summary">
      <div className="summary-header">
        <h1>Bout Complete</h1>
        <div className="final-score">
          <div className={`team-score ${homeScore > awayScore ? 'winner' : ''}`}>
            <span className="team-name">{bout.home_team.name}</span>
            <span className="score">{homeScore}</span>
          </div>
          <div className="vs">vs</div>
          <div className={`team-score ${awayScore > homeScore ? 'winner' : ''}`}>
            <span className="team-name">{bout.away_team.name}</span>
            <span className="score">{awayScore}</span>
          </div>
        </div>
        {winningTeam && (
          <div className="winner-announcement">
            🏆 {winningTeam.name} Wins!
          </div>
        )}
        {homeScore === awayScore && (
          <div className="tie-announcement">
            🤝 It's a Tie!
          </div>
        )}
      </div>

      <div className="teams-stats">
        <div className="team-stats-section">
          <h2>{bout.home_team.name} Players</h2>
          <div className="players-list">
            {homeTeamPlayers.map(player => (
              <PlayerStatsSummary 
                key={player.id} 
                player={player}
              />
            ))}
          </div>
        </div>

        <div className="team-stats-section">
          <h2>{bout.away_team.name} Players</h2>
          <div className="players-list">
            {awayTeamPlayers.map(player => (
              <PlayerStatsSummary 
                key={player.id} 
                player={player}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button onClick={onNewBout} className="new-bout-btn">
          Start New Bout
        </button>
        <button onClick={onBackToBouts} className="back-to-bouts-btn">
          Back to Bouts
        </button>
      </div>
    </div>
  )
}

export default BoutSummary