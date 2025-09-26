import { useState, useEffect, useCallback } from 'react'
import { requireSupabase } from '../lib/supabase'
import type { Bout, Player, PlayerStats, Team } from '../lib/supabase'
import PlayerStatCard from './PlayerStatCard'
import LiveBoutHeader from './LiveBoutHeader'
import JamLineupSelector from './JamLineupSelector'
import BoutSummary from './BoutSummary'
import './LiveStatTracker.css'

interface ExtendedPlayer extends Player {
  position: string
  team_number: string
  is_active: boolean
  team_id: string
}



interface LiveStatTrackerProps {
  boutId?: string | null
}

const LiveStatTracker: React.FC<LiveStatTrackerProps> = ({ boutId }) => {
  const [bout, setBout] = useState<(Bout & { home_team: Team; away_team: Team }) | null>(null)
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<ExtendedPlayer[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<ExtendedPlayer[]>([])
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerStats>>(new Map())
  const [currentJam, setCurrentJam] = useState(1)
  const [isJamActive, setIsJamActive] = useState(false)
  const [showLineupSelector, setShowLineupSelector] = useState(true)
  const [currentJamLineup, setCurrentJamLineup] = useState<{home: ExtendedPlayer[], away: ExtendedPlayer[]}>({home: [], away: []})
  const [jamPointsScored, setJamPointsScored] = useState<Map<string, number>>(new Map())
  const [isBoutComplete, setIsBoutComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statsInitialized, setStatsInitialized] = useState(false)

  // Fetch bout data
  useEffect(() => {
    if (!boutId) return
    
    const fetchBout = async () => {
      try {
        const supabase = requireSupabase()
        const { data, error } = await supabase
          .from('bouts')
          .select(`
            *,
            home_team:teams!bouts_home_team_id_fkey(*),
            away_team:teams!bouts_away_team_id_fkey(*)
          `)
          .eq('id', boutId)
          .single()

        if (error) throw error
        setBout(data)
        setStatsInitialized(false) // Reset when bout changes
      } catch (error) {
        console.error('Error fetching bout:', error)
        setError('Failed to load bout data')
      }
    }

    fetchBout()
  }, [boutId])

  const fetchTeamPlayers = useCallback(async () => {
    if (!bout) return

    try {
      setLoading(true)
      const supabase = requireSupabase()

      // Fetch home team player relationships
      const { data: homeTeamData, error: homeTeamError } = await supabase
        .from('player_teams')
        .select('player_id, number, position, is_active')
        .eq('team_id', bout.home_team_id)
        .eq('is_active', true)

      if (homeTeamError) throw homeTeamError

      // Fetch away team player relationships
      const { data: awayTeamData, error: awayTeamError } = await supabase
        .from('player_teams')
        .select('player_id, number, position, is_active')
        .eq('team_id', bout.away_team_id)
        .eq('is_active', true)

      if (awayTeamError) throw awayTeamError

      // Get all player IDs
      const allPlayerIds = [
        ...(homeTeamData?.map(pt => pt.player_id) || []),
        ...(awayTeamData?.map(pt => pt.player_id) || [])
      ]

      // Fetch player details
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .in('id', allPlayerIds)

      if (playersError) throw playersError

      // Combine player data with team info
      const homePlayersData = homeTeamData?.map(pt => {
        const player = playersData?.find(p => p.id === pt.player_id)
        return {
          ...player,
          position: pt.position,
          team_number: pt.number,
          is_active: pt.is_active,
          team_id: bout.home_team_id
        }
      }).filter(Boolean) as ExtendedPlayer[] || []

      const awayPlayersData = awayTeamData?.map(pt => {
        const player = playersData?.find(p => p.id === pt.player_id)
        return {
          ...player,
          position: pt.position,
          team_number: pt.number,
          is_active: pt.is_active,
          team_id: bout.away_team_id
        }
      }).filter(Boolean) as ExtendedPlayer[] || []

      setHomeTeamPlayers(homePlayersData)
      setAwayTeamPlayers(awayPlayersData)
    } catch (err) {
      console.error('Error fetching team players:', err)
      setError('Failed to load team players')
    } finally {
      setLoading(false)
    }
  }, [bout])

  // Fetch team players
  useEffect(() => {
    if (!bout) return
    fetchTeamPlayers()
  }, [bout, fetchTeamPlayers])

  const initializePlayerStats = useCallback(async () => {
    if (!bout) return

    const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers]
    const statsMap = new Map<string, PlayerStats>()

    // Try to fetch existing stats for this bout
    try {
      const supabase = requireSupabase()
      const { data: existingStats, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('bout_id', bout.id)

      if (error) throw error

      // Create stats for all players
      const playersNeedingStats = []
      
      for (const player of allPlayers) {
        const existingStat = existingStats?.find(stat => stat.player_id === player.id)
        
        if (existingStat) {
          statsMap.set(player.id, existingStat)
        } else {
          const newStat = {
            bout_id: bout.id,
            player_id: player.id,
            jams_played: 0,
            lead_jammer: 0,
            points_scored: 0,
            penalties: 0,
            blocks: 0,
            assists: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          playersNeedingStats.push(newStat)
        }
      }

      // Create missing player stats in database using upsert to handle duplicates
      if (playersNeedingStats.length > 0) {
        const { data: newStats, error: insertError } = await supabase
          .from('player_stats')
          .upsert(playersNeedingStats, { 
            onConflict: 'player_id,bout_id',
            ignoreDuplicates: false 
          })
          .select()

        if (insertError) {
          console.error('Error upserting player stats:', insertError)
          throw insertError
        }

        // Add the new stats to the map
        if (newStats) {
          newStats.forEach(stat => {
            statsMap.set(stat.player_id, stat)
          })
        }
      }

      setPlayerStats(statsMap)
      setStatsInitialized(true)
    } catch (err) {
      console.error('Error initializing player stats:', err)
      setError('Failed to initialize player statistics')
    }
  }, [homeTeamPlayers, awayTeamPlayers, bout])

  // Initialize player stats when teams are loaded
  useEffect(() => {
    if ((homeTeamPlayers.length > 0 || awayTeamPlayers.length > 0) && bout && !statsInitialized) {
      initializePlayerStats()
    }
  }, [homeTeamPlayers, awayTeamPlayers, bout, statsInitialized, initializePlayerStats])

  const updatePlayerStat = async (playerId: string, statType: keyof PlayerStats, delta: number) => {
    const currentStats = playerStats.get(playerId)
    if (!currentStats || !bout) return

    const currentValue = (currentStats[statType] as number) || 0
    const newValue = Math.max(0, currentValue + delta)
    
    const updatedStats = {
      ...currentStats,
      [statType]: newValue,
      updated_at: new Date().toISOString()
    }

    // Update local state immediately
    const newStatsMap = new Map(playerStats)
    newStatsMap.set(playerId, updatedStats)
    setPlayerStats(newStatsMap)

    // Track points scored during jam, but don't update bout score until jam ends
    if (statType === 'points_scored' && delta !== 0 && isJamActive) {
      const currentJamPoints = jamPointsScored.get(playerId) || 0
      const newJamPoints = new Map(jamPointsScored)
      newJamPoints.set(playerId, currentJamPoints + delta)
      setJamPointsScored(newJamPoints)
    }

    // Update database - we should always have an ID now
    try {
      const supabase = requireSupabase()
      const { error } = await supabase
        .from('player_stats')
        .update(updatedStats)
        .eq('id', updatedStats.id)

      if (error) throw error
    } catch (err) {
      console.error('Error updating player stat:', err)
      // Revert local state on error
      const revertedStatsMap = new Map(playerStats)
      revertedStatsMap.set(playerId, currentStats)
      setPlayerStats(revertedStatsMap)
    }
  }

  const updateBoutScoreFromJam = async () => {
    if (!bout || jamPointsScored.size === 0) return

    try {
      // Calculate total points for home and away teams
      let homePoints = 0
      let awayPoints = 0

      jamPointsScored.forEach((points, playerId) => {
        const isHomeTeam = homeTeamPlayers.some(p => p.id === playerId)
        if (isHomeTeam) {
          homePoints += points
        } else {
          awayPoints += points
        }
      })

      // Only update if there are points to add
      if (homePoints === 0 && awayPoints === 0) return

      const currentHomeScore = bout.home_score || 0
      const currentAwayScore = bout.away_score || 0
      
      const updatedBout = {
        ...bout,
        home_score: currentHomeScore + homePoints,
        away_score: currentAwayScore + awayPoints,
        updated_at: new Date().toISOString()
      }

      // Update local state immediately
      setBout(updatedBout)

      // Update database
      const supabase = requireSupabase()
      const { error } = await supabase
        .from('bouts')
        .update({
          home_score: updatedBout.home_score,
          away_score: updatedBout.away_score,
          updated_at: updatedBout.updated_at
        })
        .eq('id', bout.id)

      if (error) {
        console.error('Error updating bout score:', error)
        // Revert on error
        setBout(bout)
      }
    } catch (err) {
      console.error('Error updating bout score:', err)
    }
  }

  const startJamLineupSelection = () => {
    setShowLineupSelector(true)
  }

  const handleJamStart = (homeLineup: ExtendedPlayer[], awayLineup: ExtendedPlayer[]) => {
    setCurrentJamLineup({ home: homeLineup, away: awayLineup })
    setShowLineupSelector(false)
    setIsJamActive(true)
    setJamPointsScored(new Map()) // Clear jam points for new jam
    
    // Increment jams_played for all players in the lineup
    const allJamPlayers = [...homeLineup, ...awayLineup]
    allJamPlayers.forEach(player => {
      updatePlayerStat(player.id, 'jams_played', 1)
    })
  }

  const endJam = async () => {
    // Calculate and update bout score with all points scored during this jam
    await updateBoutScoreFromJam()
    
    setIsJamActive(false)
    setCurrentJam(prev => prev + 1)
    setCurrentJamLineup({ home: [], away: [] })
    setJamPointsScored(new Map()) // Clear jam points for next jam
    setShowLineupSelector(true)
  }

  const endBout = async () => {
    if (!bout) return
    
    // End any active jam first
    if (isJamActive) {
      await updateBoutScoreFromJam()
      setIsJamActive(false)
    }
    
    try {
      const supabase = requireSupabase()
      const { error } = await supabase
        .from('bouts')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bout.id)

      if (error) {
        console.error('Error ending bout:', error)
        return
      }

      // Update local state
      setBout({
        ...bout,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      
      setIsBoutComplete(true)
    } catch (err) {
      console.error('Error ending bout:', err)
    }
  }

  const handleNewBout = () => {
    // Reset all state for a new bout
    setIsBoutComplete(false)
    setCurrentJam(1)
    setIsJamActive(false)
    setShowLineupSelector(true)
    setPlayerStats(new Map())
    setJamPointsScored(new Map())
    setBout(null)
    // Navigate back or reload - depending on your routing setup
    window.location.reload()
  }

  const cancelLineupSelection = () => {
    // If it's jam 1, we can't cancel (must select lineup to start)
    // For subsequent jams, go back to the previous jam view
    if (currentJam > 1) {
      setShowLineupSelector(false)
      setCurrentJam(prev => prev - 1)
    }
  }

  if (!boutId) {
    return (
      <div className="live-tracker-placeholder">
        <div className="placeholder-content">
          <h2>📊 Live Stat Tracker</h2>
          <p>Select a bout from the Bouts page to start live tracking</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="live-tracker-loading">
        <div className="loading-spinner">Loading bout data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="live-tracker-error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (!bout) {
    return (
      <div className="live-tracker-loading">
        <div className="loading-spinner">Loading bout...</div>
      </div>
    )
  }

  // Show bout summary if bout is complete
  if (isBoutComplete) {
    return (
      <BoutSummary
        bout={bout}
        homeTeamPlayers={homeTeamPlayers}
        awayTeamPlayers={awayTeamPlayers}
        playerStats={playerStats}
        onNewBout={handleNewBout}
      />
    )
  }

  return (
    <div className="live-stat-tracker">
      {showLineupSelector ? (
        <JamLineupSelector
          homeTeamPlayers={homeTeamPlayers}
          awayTeamPlayers={awayTeamPlayers}
          onStartJam={handleJamStart}
          onCancel={cancelLineupSelection}
          currentJam={currentJam}
        />
      ) : (
        <>
          <LiveBoutHeader 
            bout={bout}
            currentJam={currentJam}
            isJamActive={isJamActive}
            onStartJam={startJamLineupSelection}
            onEndJam={endJam}
            onEndBout={endBout}
          />

          <div className="teams-container">
            <div className="team-section home-team">
              <div className="players-grid">
                {(isJamActive ? currentJamLineup.home : homeTeamPlayers).map(player => (
                  <PlayerStatCard
                    key={player.id}
                    player={player}
                    stats={playerStats.get(player.id)}
                    onStatUpdate={(statType, delta) => updatePlayerStat(player.id, statType, delta)}
                    isJamActive={isJamActive}
                  />
                ))}
              </div>
            </div>

            <div className="team-section away-team">
              <div className="players-grid">
                {(isJamActive ? currentJamLineup.away : awayTeamPlayers).map(player => (
                  <PlayerStatCard
                    key={player.id}
                    player={player}
                    stats={playerStats.get(player.id)}
                    onStatUpdate={(statType, delta) => updatePlayerStat(player.id, statType, delta)}
                    isJamActive={isJamActive}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LiveStatTracker