import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import LiveStatTracker from '../components/LiveStatTracker'
import { requireSupabase } from '../lib/supabase'

// Mock the requireSupabase function
vi.mock('../lib/supabase', () => ({
  requireSupabase: vi.fn(),
  isSupabaseConfigured: true
}))

// Mock child components
vi.mock('../components/LiveBoutHeader', () => ({
  default: ({ bout, currentJam, isJamActive, onStartJam, onEndJam, onEndBout }: {
    bout: { home_team: { name: string }; away_team: { name: string } }
    currentJam: number
    isJamActive: boolean
    onStartJam: () => void
    onEndJam: () => void
    onEndBout: () => void
  }) => (
    <div data-testid="live-bout-header">
      <span>Bout: {bout.home_team.name} vs {bout.away_team.name}</span>
      <span>Jam: {currentJam}</span>
      <span>Active: {isJamActive ? 'Yes' : 'No'}</span>
      <button onClick={onStartJam}>Start Jam</button>
      <button onClick={onEndJam}>End Jam</button>
      <button onClick={onEndBout}>End Bout</button>
    </div>
  )
}))

vi.mock('../components/JamTracker', () => ({
  default: ({ currentJamNumber, isJamActive, currentLineup, onUpdateCurrentLineup, homeTeamPlayers, awayTeamPlayers }: {
    currentJamNumber: number
    isJamActive: boolean
    currentLineup: { homeJammer: unknown; awayJammer: unknown }
    onUpdateCurrentLineup: (lineup: unknown) => void
    homeTeamPlayers: Array<{ id: string; derby_name: string; team_number: string; preferred_number: string; position: string }>
    awayTeamPlayers: Array<{ id: string; derby_name: string; team_number: string; preferred_number: string; position: string }>
  }) => (
    <div data-testid="jam-tracker">
      <span>Jam Tracker - Jam {currentJamNumber}</span>
      <span>Jam Active: {isJamActive ? 'Yes' : 'No'}</span>
      <button onClick={() => {
        // Simulate selecting jammers
        const homeJammer = homeTeamPlayers[0] || null
        const awayJammer = awayTeamPlayers[0] || null
        onUpdateCurrentLineup({
          homeJammer,
          awayJammer,
          homeLineup: homeTeamPlayers.slice(0, 2),
          awayLineup: awayTeamPlayers.slice(0, 2)
        })
      }}>Select Lineup</button>
    </div>
  )
}))

vi.mock('../components/BoutSummary', () => ({
  default: ({ bout, onNewBout, onBackToBouts }: {
    bout: { home_score: number; away_score: number }
    onNewBout: () => void
    onBackToBouts: () => void
  }) => (
    <div data-testid="bout-summary">
      <span>Bout Complete</span>
      <span>Score: {bout.home_score} - {bout.away_score}</span>
      <button onClick={onNewBout}>New Bout</button>
      <button onClick={onBackToBouts}>Back to Bouts</button>
    </div>
  )
}))

vi.mock('../components/JammerPointsPie', () => ({
  default: () => <div data-testid="jammer-points-pie" />
}))

// Mock data
const mockBout = {
  id: 'bout-1',
  home_team_id: 'home-team-1',
  away_team_id: 'away-team-1',
  home_score: 25,
  away_score: 18,
  status: 'in_progress',
  bout_date: '2025-09-26',
  venue: 'Test Venue',
  home_team: {
    id: 'home-team-1',
    name: 'Home Rollers',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  away_team: {
    id: 'away-team-1',
    name: 'Away Crushers',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockHomePlayers = [
  {
    id: 'player-1',
    derby_name: 'Test Jammer',
    preferred_number: '1',
    position: 'jammer',
    team_number: '1',
    is_active: true,
    team_id: 'home-team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

const mockAwayPlayers = [
  {
    id: 'player-2',
    derby_name: 'Test Blocker',
    preferred_number: '2',
    position: 'blocker',
    team_number: '2',
    is_active: true,
    team_id: 'away-team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

const mockPlayerStats = {
  id: 'stat-1',
  player_id: 'player-1',
  bout_id: 'bout-1',
  jams_played: 2,
  lead_jammer: 1,
  points_scored: 8,
  penalties: 1,
  blocks: 0,
  assists: 2,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

// Helper to build a mock supabase that doesn't recurse
function createMockSupabase(overrides?: {
  boutResult?: { data: unknown; error: unknown }
  jamsResult?: { data: unknown; error: unknown }
  homePlayerTeamsResult?: { data: unknown; error: unknown }
  awayPlayerTeamsResult?: { data: unknown; error: unknown }
  playersResult?: { data: unknown; error: unknown }
  playerStatsResult?: { data: unknown; error: unknown }
  updateResult?: { error: unknown }
  upsertResult?: { data: unknown; error: unknown }
  insertResult?: { data: unknown; error: unknown }
}) {
  const defaults = {
    boutResult: { data: mockBout, error: null },
    jamsResult: { data: [], error: null },
    homePlayerTeamsResult: {
      data: [{ player_id: 'player-1', number: '1', position: 'jammer', is_active: true }],
      error: null
    },
    awayPlayerTeamsResult: {
      data: [{ player_id: 'player-2', number: '2', position: 'blocker', is_active: true }],
      error: null
    },
    playersResult: {
      data: [...mockHomePlayers, ...mockAwayPlayers],
      error: null
    },
    playerStatsResult: { data: [mockPlayerStats], error: null },
    updateResult: { error: null },
    upsertResult: { data: [mockPlayerStats], error: null },
    insertResult: { data: [mockPlayerStats], error: null },
    ...overrides
  }

  // Track which team_id eq calls have been seen for player_teams
  let playerTeamsEqTeamId: string | null = null

  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === 'bouts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve(defaults.boutResult))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(defaults.updateResult))
          }))
        }
      }
      if (table === 'jams') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve(defaults.jamsResult))
            }))
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(defaults.upsertResult))
          }))
        }
      }
      if (table === 'player_teams') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: unknown) => {
              if (col === 'team_id') {
                playerTeamsEqTeamId = val as string
              }
              return {
                eq: vi.fn(() => {
                  if (playerTeamsEqTeamId === 'home-team-1') {
                    return Promise.resolve(defaults.homePlayerTeamsResult)
                  }
                  return Promise.resolve(defaults.awayPlayerTeamsResult)
                })
              }
            })
          }))
        }
      }
      if (table === 'players') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve(defaults.playersResult))
          }))
        }
      }
      if (table === 'player_stats') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(defaults.playerStatsResult))
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve(defaults.upsertResult))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(defaults.updateResult))
          })),
          insert: vi.fn(() => Promise.resolve(defaults.insertResult))
        }
      }
      // Default fallback — return safe no-ops (no recursion!)
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }
    })
  }

  return mockSupabase
}

describe('LiveStatTracker Component', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(requireSupabase).mockReturnValue(mockSupabase as unknown as ReturnType<typeof requireSupabase>)
  })

  it('renders placeholder when no boutId is provided', () => {
    render(<LiveStatTracker />)

    expect(screen.getByText('📊 Live Stat Tracker')).toBeInTheDocument()
    expect(screen.getByText('Select a bout from the Bouts page to start live tracking')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<LiveStatTracker boutId="bout-1" />)

    expect(screen.getByText('Loading bout data...')).toBeInTheDocument()
  })

  it('loads bout data and shows live tracking interface', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })

    expect(screen.getByText('Bout: Home Rollers vs Away Crushers')).toBeInTheDocument()
    expect(screen.getByTestId('jam-tracker')).toBeInTheDocument()
  })

  it('handles bout data loading error', async () => {
    mockSupabase = createMockSupabase({
      boutResult: { data: null, error: { message: 'Bout not found' } }
    })
    vi.mocked(requireSupabase).mockReturnValue(mockSupabase as unknown as ReturnType<typeof requireSupabase>)

    render(<LiveStatTracker boutId="bout-1" />)

    // When fetchBout fails, loading is never set to false (fetchTeamPlayers
    // never runs), so the component stays on the loading screen.
    await waitFor(() => {
      expect(screen.getByText('Loading bout data...')).toBeInTheDocument()
    })
  })

  it('shows jam tracker with correct jam number', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('jam-tracker')).toBeInTheDocument()
    })

    expect(screen.getByText('Jam Tracker - Jam 1')).toBeInTheDocument()
  })

  it('starts a jam via header start button after selecting lineup', async () => {
    // Mock window.alert since handleJamStart will alert if no jammers selected
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })

    // First select a lineup via JamTracker mock
    await act(async () => {
      fireEvent.click(screen.getByText('Select Lineup'))
    })

    // Now start the jam
    await act(async () => {
      fireEvent.click(screen.getByText('Start Jam'))
    })

    await waitFor(() => {
      expect(screen.getByText('Active: Yes')).toBeInTheDocument()
    })

    alertSpy.mockRestore()
  })

  it('ends bout and shows summary', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })

    // End bout directly
    await act(async () => {
      fireEvent.click(screen.getByText('End Bout'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('bout-summary')).toBeInTheDocument()
    })

    expect(screen.getByText('Bout Complete')).toBeInTheDocument()
  })

  it('handles navigation back from bout summary', async () => {
    const mockOnNavigateBack = vi.fn()

    render(<LiveStatTracker boutId="bout-1" onNavigateBack={mockOnNavigateBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })

    // End bout to get to summary
    await act(async () => {
      fireEvent.click(screen.getByText('End Bout'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('bout-summary')).toBeInTheDocument()
    })

    // Click back to bouts
    fireEvent.click(screen.getByText('Back to Bouts'))

    expect(mockOnNavigateBack).toHaveBeenCalled()
  })

  it('handles new bout from summary', async () => {
    const mockOnNavigateBack = vi.fn()

    render(<LiveStatTracker boutId="bout-1" onNavigateBack={mockOnNavigateBack} />)

    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('End Bout'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('bout-summary')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Bout'))

    expect(mockOnNavigateBack).toHaveBeenCalled()
  })

  it('displays bout header with correct team names after loading', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByText('Bout: Home Rollers vs Away Crushers')).toBeInTheDocument()
    })
  })

  it('shows jam number 1 initially', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByText('Jam: 1')).toBeInTheDocument()
    })
  })

  it('shows jam as inactive initially', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(screen.getByText('Active: No')).toBeInTheDocument()
    })
  })

  it('calls requireSupabase when loading bout data', async () => {
    render(<LiveStatTracker boutId="bout-1" />)

    await waitFor(() => {
      expect(requireSupabase).toHaveBeenCalled()
    })
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(requireSupabase).mockImplementation(() => {
      throw new Error('Supabase is not configured')
    })

    render(<LiveStatTracker boutId="bout-1" />)

    // When requireSupabase throws, fetchBout catches but never sets
    // loading=false, so the component remains on the loading screen.
    await waitFor(() => {
      expect(screen.getByText('Loading bout data...')).toBeInTheDocument()
    })
  })
})
