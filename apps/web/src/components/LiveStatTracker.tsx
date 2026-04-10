import { useState, useEffect, useCallback } from 'react'
import { requireSupabase } from '../lib/supabase'
import type { Bout, PlayerStats, Team } from '../lib/supabase'
import type { ExtendedPlayer } from '../types'
import LiveBoutHeader from './LiveBoutHeader'
import JamTracker from './JamTracker'
import BoutSummary from './BoutSummary'
import JammerPointsPie from './JammerPointsPie'
import './LiveStatTracker.css'

interface LiveStatTrackerProps {
  boutId?: string | null
  onNavigateBack?: () => void
}

const LiveStatTracker: React.FC<LiveStatTrackerProps> = ({ boutId, onNavigateBack }) => {
  const [bout, setBout] = useState<(Bout & { home_team: Team; away_team: Team }) | null>(null)
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<ExtendedPlayer[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<ExtendedPlayer[]>([])
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerStats>>(new Map())

  // Keep hooks ordered and unconditional: handler for updating jam scores
  const handleUpdateJamScore = useCallback((jamNumber: number, team: 'home' | 'away', score: number) => {
    setJams(currentJams => {
      return currentJams.map(jam => {
        if (jam.jamNumber === jamNumber) {
          return {
            ...jam,
            [team === 'home' ? 'homeScore' : 'awayScore']: score
          }
        }
        return jam
      })
    })
  }, [])
  const [currentJam, setCurrentJam] = useState(1)
  const [isJamActive, setIsJamActive] = useState(false)
  const [isBoutComplete, setIsBoutComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statsInitialized, setStatsInitialized] = useState(false)
  const [jams, setJams] = useState<Array<{
    jamNumber: number
    homeJammer: ExtendedPlayer | null
    awayJammer: ExtendedPlayer | null
    homeScore: number
    awayScore: number
    homeLineup: ExtendedPlayer[]
    awayLineup: ExtendedPlayer[]
    isComplete: boolean
    id?: string
    homeJammerId?: string | null
    awayJammerId?: string | null
  }>>([]);
  const [currentLineup, setCurrentLineup] = useState<{
    homeJammer: ExtendedPlayer | null
    awayJammer: ExtendedPlayer | null
    homeLineup: ExtendedPlayer[]
    awayLineup: ExtendedPlayer[]
  }>({
    homeJammer: null,
    awayJammer: null,
    homeLineup: [],
    awayLineup: []
  })

  // Jam persistence handled server-side (loaded when fetching bout; saved on jams change)

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
        // load jams for this bout from server (if any)
        try {
          const supabase = requireSupabase()
          ;(async () => {
            type ServerJamRow = {
              jam_number: number
              home_jammer_id?: string | null
              away_jammer_id?: string | null
              home_score?: number | null
              away_score?: number | null
              home_lineup?: unknown[] | null
              away_lineup?: unknown[] | null
              is_complete?: boolean | null
              id?: string
            }

            const { data: jamsData, error: jamsError } = await supabase
              .from('jams')
              .select('*')
              .eq('bout_id', boutId)
              .order('jam_number', { ascending: true })

            if (!jamsError && jamsData) {
              const mapLineup = (lineup: unknown[] | null | undefined, teamPlayers: ExtendedPlayer[]) => {
                if (!Array.isArray(lineup)) return []
                return lineup.map(item => {
                  if (typeof item === 'string') return teamPlayers.find(p => p.id === item) || null
                  if (item && typeof item === 'object' && 'id' in item) return teamPlayers.find(p => p.id === (item as { id?: string }).id) || null
                  return null
                }).filter(Boolean) as ExtendedPlayer[]
              }

                // Store jammer IDs now and map to player objects later once players are loaded
                const mapped = (jamsData as ServerJamRow[]).map(j => ({
                  jamNumber: j.jam_number,
                  homeJammer: null,
                  awayJammer: null,
                  homeJammerId: j.home_jammer_id || null,
                  awayJammerId: j.away_jammer_id || null,
                  homeScore: j.home_score || 0,
                  awayScore: j.away_score || 0,
                  homeLineup: mapLineup(j.home_lineup, homeTeamPlayers),
                  awayLineup: mapLineup(j.away_lineup, awayTeamPlayers),
                  isComplete: !!j.is_complete,
                  id: j.id
                }))
              setJams(mapped)
              const maxJam = mapped.reduce((m, x) => Math.max(m, x.jamNumber || 0), 0)
              if (maxJam > 0) setCurrentJam(maxJam + 1)
            }
          })()
        } catch {
          // ignore - will default to empty jams
        }
      } catch (error) {
        console.error('Error fetching bout:', error)
        setError('Failed to load bout data')
      }
    }

    fetchBout()
  }, [boutId])

  // Map stored jammer IDs to player objects once team players are available
  useEffect(() => {
    if (jams.length === 0) return
    if (homeTeamPlayers.length === 0 && awayTeamPlayers.length === 0) return

    setJams(current => current.map(j => ({
      ...j,
      homeJammer: j.homeJammer || (j.homeJammerId ? homeTeamPlayers.find(p => p.id === j.homeJammerId) || null : null),
      awayJammer: j.awayJammer || (j.awayJammerId ? awayTeamPlayers.find(p => p.id === j.awayJammerId) || null : null)
    })))
  }, [homeTeamPlayers, awayTeamPlayers, jams.length])

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

      // Ensure no player appears on both teams for this bout
      const homePlayerIds = new Set(homePlayersData.map(p => p.id))
      const awayPlayerIds = new Set(awayPlayersData.map(p => p.id))
      
      // Find any players that appear on both teams
      const duplicatePlayerIds = [...homePlayerIds].filter(id => awayPlayerIds.has(id))
      
      if (duplicatePlayerIds.length > 0) {
        console.warn('Warning: Players found on both teams for this bout:', duplicatePlayerIds)
        // For now, we'll prioritize home team assignment, but this should be addressed in data management
        const filteredAwayPlayers = awayPlayersData.filter(p => !homePlayerIds.has(p.id))
        setAwayTeamPlayers(filteredAwayPlayers)
      } else {
        setAwayTeamPlayers(awayPlayersData)
      }
      
      setHomeTeamPlayers(homePlayersData)
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
    // Jam data is loaded from server when the bout is fetched
  }, [bout, fetchTeamPlayers])

  // Save jams whenever they change
  useEffect(() => {
    if (!bout) return
    // Persist to server
    const save = async () => {
      try {
        const supabase = requireSupabase()
          const payload = jams.map(j => ({
          id: j.id || undefined,
          bout_id: bout.id,
          jam_number: j.jamNumber,
          home_jammer_id: j.homeJammer?.id || null,
          away_jammer_id: j.awayJammer?.id || null,
          home_score: j.homeScore || 0,
          away_score: j.awayScore || 0,
          home_lineup: j.homeLineup || [],
          away_lineup: j.awayLineup || [],
          is_complete: !!j.isComplete,
          updated_at: new Date().toISOString()
        }))

        const { error } = await supabase
          .from('jams')
          .upsert(payload, { onConflict: 'bout_id,jam_number' })

        if (error) console.warn('Error saving jams to server', error)
      } catch (err) {
        console.warn('Failed to save jams to server', err)
      }
    }

    save()
  }, [jams, bout])

  const initializePlayerStats = useCallback(async () => {
    if (!bout) return

    // Deduplicate players by ID to avoid conflicts
    const allPlayersMap = new Map<string, ExtendedPlayer>()
    homeTeamPlayers.forEach(player => allPlayersMap.set(player.id, player))
    awayTeamPlayers.forEach(player => allPlayersMap.set(player.id, player))
    const allPlayers = Array.from(allPlayersMap.values())
    
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
            ignoreDuplicates: true 
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

    // Note: individual player points are recorded to player stats.
    // Jam-level scoring is handled via the JamTracker and stored in `jams`.

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
    if (!bout) return

    try {
      // Find the active jam (not complete)
      const activeJam = jams.find(j => !j.isComplete)
      if (!activeJam) return

      const homePoints = activeJam.homeScore || 0
      const awayPoints = activeJam.awayScore || 0

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

  const handleJamStart = () => {
    if (!currentLineup.homeJammer || !currentLineup.awayJammer) {
      alert('Please select jammers for both teams before starting the jam')
      return
    }

    const newJam = {
      jamNumber: currentJam,
      homeJammer: currentLineup.homeJammer,
      awayJammer: currentLineup.awayJammer,
      homeScore: 0,
      awayScore: 0,
      homeLineup: currentLineup.homeLineup,
      awayLineup: currentLineup.awayLineup,
      isComplete: false
    }

    setJams([...jams, newJam])
    setIsJamActive(true)
    
    // Increment jams_played for all players in the lineup
    const allJamPlayers = [...currentLineup.homeLineup, ...currentLineup.awayLineup]
    allJamPlayers.forEach(player => {
      updatePlayerStat(player.id, 'jams_played', 1)
    })
  }

  const endJam = async () => {
    const currentJamIndex = jams.findIndex(jam => !jam.isComplete)
    if (currentJamIndex === -1) return

    const updatedJams = [...jams]
    updatedJams[currentJamIndex].isComplete = true
    
    // Update bout score
    if (!bout) return
    const newHomeScore = (bout.home_score || 0) + updatedJams[currentJamIndex].homeScore
    const newAwayScore = (bout.away_score || 0) + updatedJams[currentJamIndex].awayScore

    try {
      const supabase = requireSupabase()
      await supabase
        .from('bouts')
        .update({
          home_score: newHomeScore,
          away_score: newAwayScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', bout.id)

      setBout({
        ...bout,
        home_score: newHomeScore,
        away_score: newAwayScore
      })
    } catch (err) {
      console.error('Error updating bout score:', err)
    }

    setJams(updatedJams)
    setIsJamActive(false)
    setCurrentJam(prev => prev + 1)
    setCurrentLineup({
      homeJammer: null,
      awayJammer: null,
      homeLineup: [],
      awayLineup: []
    })
    // Update player stats for jammers who scored in this jam
    try {
      const finishedJam = updatedJams[currentJamIndex]
      if (finishedJam) {
        if (finishedJam.homeJammer && finishedJam.homeScore && finishedJam.homeScore > 0) {
          updatePlayerStat(finishedJam.homeJammer.id, 'points_scored', finishedJam.homeScore)
        }
        if (finishedJam.awayJammer && finishedJam.awayScore && finishedJam.awayScore > 0) {
          updatePlayerStat(finishedJam.awayJammer.id, 'points_scored', finishedJam.awayScore)
        }
      }
    } catch (err) {
      console.warn('Failed to update jammer player stats on jam end', err)
    }
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

  const handleBackToBouts = () => {
    // Navigate back to bout selection via parent component
    if (onNavigateBack) {
      onNavigateBack()
    }
  }

  const handleNewBout = () => {
    // Reset all state for a new bout
    setIsBoutComplete(false)
    setCurrentJam(1)
    setIsJamActive(false)
    setPlayerStats(new Map())
    setStatsInitialized(false)
    setBout(null)
    setError('')
    setLoading(false)
    
    // Navigate back to bout selection via parent component
    handleBackToBouts()
  }

  const handleEditJam = (jamNumber: number) => {
    // Find jam and mark it editable
    const jamIndex = jams.findIndex(j => j.jamNumber === jamNumber)
    if (jamIndex === -1) return

    const jamToEdit = jams[jamIndex]
    // Make a shallow copy and mark not complete so inputs render
    const updatedJams = [...jams]
    updatedJams[jamIndex] = { ...jamToEdit, isComplete: false }
    setJams(updatedJams)

    // Populate current lineup so the user can adjust jammers
    setCurrentLineup({
      homeJammer: jamToEdit.homeJammer,
      awayJammer: jamToEdit.awayJammer,
      homeLineup: jamToEdit.homeLineup || [],
      awayLineup: jamToEdit.awayLineup || []
    })

    setCurrentJam(jamNumber)
    setIsJamActive(true)
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
        onBackToBouts={handleBackToBouts}
      />
    )
  }

  

  return (
    <div className="live-stat-tracker">
      <LiveBoutHeader 
        bout={bout}
        currentJam={currentJam}
        isJamActive={isJamActive}
        onStartJam={handleJamStart}
        onEndJam={endJam}
        onEndBout={endBout}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', position: 'relative', overflow: 'visible' }}>
        <JamTracker
        jams={jams}
        currentLineup={currentLineup}
        isJamActive={isJamActive}
        homeTeamPlayers={homeTeamPlayers}
        awayTeamPlayers={awayTeamPlayers}
        onUpdateCurrentLineup={setCurrentLineup}
        onUpdateJamScore={handleUpdateJamScore}
        onEditJam={handleEditJam}
        currentJamNumber={currentJam}
        />

        <div>
          {bout && (
            <JammerPointsPie
              teamName={bout.home_team.name}
              players={homeTeamPlayers}
              playerStats={playerStats}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveStatTracker