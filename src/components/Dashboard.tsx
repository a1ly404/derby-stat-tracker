import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Team } from '../lib/supabase'
import { getStatsEmoji, getActivityEmoji } from '../utils/emojis'
import './Dashboard.css'

interface PlayerTeam {
  player_id: string
  is_active: boolean
  position: string
  number: string
  players: {
    derby_name: string
  }
}

interface TeamWithStats extends Team {
  player_count: number
  active_players: number
  recent_players: Array<{
    derby_name: string
    position: string
    number: string
  }>
}

interface DashboardStats {
  total_teams: number
  total_players: number
  total_bouts: number
  unique_active_players: number
  recent_activity: Array<{
    type: 'player_added' | 'team_added' | 'bout_scheduled'
    message: string
    date: string
  }>
}

const Dashboard: React.FC = () => {
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_teams: 0,
    total_players: 0,
    total_bouts: 0,
    unique_active_players: 0,
    recent_activity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch teams with player counts
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          player_teams (
            player_id,
            is_active,
            position,
            number,
            players (
              derby_name
            )
          )
        `)
        .order('name')

      if (teamsError) throw teamsError

      // Transform teams data
      const transformedTeams: TeamWithStats[] = (teamsData || []).map(team => {
        const playerTeams = team.player_teams || []
        const activePlayerTeams = playerTeams.filter((pt: PlayerTeam) => pt.is_active)

        return {
          ...team,
          player_count: playerTeams.length,
          active_players: activePlayerTeams.length,
          recent_players: activePlayerTeams.slice(0, 3).map((pt: PlayerTeam) => ({
            derby_name: pt.players.derby_name,
            position: pt.position,
            number: pt.number
          }))
        }
      })

      setTeams(transformedTeams)

      // Fetch overall stats
      const [playersResult, boutsResult] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('bouts').select('id', { count: 'exact', head: true })
      ])

      // Calculate unique active players across all teams
      const allActivePlayerIds = new Set<string>()
      teamsData?.forEach(team => {
        const playerTeams = team.player_teams || []
        playerTeams.forEach((pt: PlayerTeam) => {
          if (pt.is_active) {
            allActivePlayerIds.add(pt.player_id)
          }
        })
      })

      // Fetch recent activity (simplified version)
      const { data: recentPlayers } = await supabase
        .from('players')
        .select('derby_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: recentTeams } = await supabase
        .from('teams')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      // Create recent activity feed
      const recentActivity = [
        ...(recentPlayers || []).map(player => ({
          type: 'player_added' as const,
          message: `New player "${player.derby_name}" added`,
          date: player.created_at
        })),
        ...(recentTeams || []).map(team => ({
          type: 'team_added' as const,
          message: `New team "${team.name}" created`,
          date: team.created_at
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

      setStats({
        total_teams: transformedTeams.length,
        total_players: playersResult.count || 0,
        total_bouts: boutsResult.count || 0,
        unique_active_players: allActivePlayerIds.size,
        recent_activity: recentActivity
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Derby Stat Tracker Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening with your derby league.</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teams-icon">{getStatsEmoji('teams')}</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total_teams}</div>
            <div className="stat-label">Teams</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon players-icon">{getStatsEmoji('players')}</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total_players}</div>
            <div className="stat-label">Players</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bouts-icon">{getStatsEmoji('bouts')}</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total_bouts}</div>
            <div className="stat-label">Bouts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active-icon">{getStatsEmoji('activeUsers')}</div>
          <div className="stat-content">
            <div className="stat-number">
              {stats.unique_active_players}
            </div>
            <div className="stat-label">Active Players</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn teams-action">
            <span className="action-icon">{getStatsEmoji('teams')}</span>
            <span className="action-text">Add New Team</span>
          </button>

          <button className="action-btn players-action">
            <span className="action-icon">{getStatsEmoji('players')}</span>
            <span className="action-text">Add New Player</span>
          </button>

          <button className="action-btn bouts-action">
            <span className="action-icon">{getStatsEmoji('bouts')}</span>
            <span className="action-text">Schedule Bout</span>
          </button>

          <button className="action-btn stats-action">
            <span className="action-icon">{getStatsEmoji('analytics')}</span>
            <span className="action-text">View Stats</span>
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Teams Overview */}
        <div className="teams-overview">
          <h2>Teams Overview</h2>
          {teams.length === 0 ? (
            <div className="empty-state">
              <p>No teams found. Create your first team to get started!</p>
            </div>
          ) : (
            <div className="teams-summary-grid">
              {teams.map(team => (
                <div key={team.id} className="team-summary-card">
                  <div className="team-summary-header">
                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt={`${team.name} logo`}
                        className="team-summary-logo"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="team-summary-info">
                      <h3 className="team-summary-name">{team.name}</h3>
                      <div className="team-summary-stats">
                        <span className="team-stat">
                          {team.active_players} active
                        </span>
                        <span className="team-stat">
                          {team.player_count} total
                        </span>
                      </div>
                    </div>
                  </div>

                  {team.recent_players.length > 0 && (
                    <div className="team-recent-players">
                      <h4>Recent Players</h4>
                      <div className="recent-players-list">
                        {team.recent_players.map((player, index) => (
                          <div key={index} className="recent-player">
                            <span className="player-name">{player.derby_name}</span>
                            <span className="player-details">
                              #{player.number} • {player.position}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {team.recent_players.length === 0 && (
                    <div className="no-players">
                      <p>No active players yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          {stats.recent_activity.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity. Start by adding teams and players!</p>
            </div>
          ) : (
            <div className="activity-list">
              {stats.recent_activity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'player_added' && getActivityEmoji('playerAdded')}
                    {activity.type === 'team_added' && getActivityEmoji('teamAdded')}
                    {activity.type === 'bout_scheduled' && getActivityEmoji('boutScheduled')}
                  </div>
                  <div className="activity-content">
                    <div className="activity-message">{activity.message}</div>
                    <div className="activity-date">
                      {new Date(activity.date).toLocaleDateString()} at{' '}
                      {new Date(activity.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard