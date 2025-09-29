import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import LiveStatTracker from '../components/LiveStatTracker'
import { requireSupabase } from '../lib/supabase'

// Mock the requireSupabase function
vi.mock('../lib/supabase', () => ({
  requireSupabase: vi.fn()
}))

// Mock interfaces
interface MockPlayerStatCardProps {
  player: { id: string; derby_name: string; position: string }
  stats: { points_scored?: number; penalties?: number }
  onStatUpdate: (stat: string, value: number) => void
  isJamActive: boolean
}

interface MockLiveBoutHeaderProps {
  bout: { home_team: { name: string }; away_team: { name: string } }
  currentJam: number
  isJamActive: boolean
  onStartJam: () => void
  onEndJam: () => void
  onEndBout: () => void
}

interface MockJamLineupSelectorProps {
  homeTeamPlayers: unknown[]
  awayTeamPlayers: unknown[]
  onStartJam: (homeLineup: unknown[], awayLineup: unknown[]) => void
  onCancel: () => void
  currentJam: number
}

interface MockBoutSummaryProps {
  bout: { home_score: number; away_score: number }
  onNewBout: () => void
  onBackToBouts: () => void
}

// Mock all child components
vi.mock('../components/PlayerStatCard', () => ({
  default: ({ player, onStatUpdate, isJamActive }: MockPlayerStatCardProps) => (
    <div data-testid={`player-card-${player.id}`}>
      <span>Player: {player.derby_name}</span>
      <span>Position: {player.position}</span>
      <button onClick={() => onStatUpdate('points_scored', 1)}>Add Point</button>
      <button onClick={() => onStatUpdate('penalties', 1)}>Add Penalty</button>
      <span>Jam Active: {isJamActive ? 'Yes' : 'No'}</span>
    </div>
  )
}))

vi.mock('../components/LiveBoutHeader', () => ({
  default: ({ bout, currentJam, isJamActive, onStartJam, onEndJam, onEndBout }: MockLiveBoutHeaderProps) => (
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

vi.mock('../components/JamLineupSelector', () => ({
  default: ({ homeTeamPlayers, awayTeamPlayers, onStartJam, onCancel, currentJam }: MockJamLineupSelectorProps) => (
    <div data-testid="jam-lineup-selector">
      <span>Jam {currentJam} Lineup Selection</span>
      <button onClick={() => onStartJam(homeTeamPlayers.slice(0, 2), awayTeamPlayers.slice(0, 2))}>
        Start Jam with Sample Lineup
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

vi.mock('../components/BoutSummary', () => ({
  default: ({ bout, onNewBout, onBackToBouts }: MockBoutSummaryProps) => (
    <div data-testid="bout-summary">
      <span>Bout Complete</span>
      <span>Score: {bout.home_score} - {bout.away_score}</span>
      <button onClick={onNewBout}>New Bout</button>
      <button onClick={onBackToBouts}>Back to Bouts</button>
    </div>
  )
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

const mockPlayers = [
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
  },
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

describe('LiveStatTracker Component', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockBout, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [mockPlayerStats], error: null }))
      }))
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSupabase).mockReturnValue(mockSupabase as typeof mockSupabase)
    
    // Mock the fetch calls for team players
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bouts') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockBout, error: null })
            })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        }
      }
      if (table === 'player_teams') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [{ player_id: 'player-1', number: '1', position: 'jammer', is_active: true }], error: null })
            })
          })
        }
      }
      if (table === 'players') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: mockPlayers, error: null })
          })
        }
      }
      if (table === 'player_stats') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [mockPlayerStats], error: null })
          }),
          upsert: () => ({
            select: () => Promise.resolve({ data: [mockPlayerStats], error: null })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        }
      }
      return mockSupabase.from()
    })
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

  it('loads bout data and shows lineup selector', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Jam 1 Lineup Selection')).toBeInTheDocument()
  })

  it('handles bout data loading error', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Bout not found' } })
        })
      })
    }))

    render(<LiveStatTracker boutId="bout-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Loading bout data...')).toBeInTheDocument()
    })
  })

  it('starts a jam and shows live tracking interface', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    // Wait for lineup selector to appear
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    // Start a jam
    const startJamButton = screen.getByText('Start Jam with Sample Lineup')
    fireEvent.click(startJamButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Bout: Home Rollers vs Away Crushers')).toBeInTheDocument()
    expect(screen.getByText('Active: Yes')).toBeInTheDocument()
  })

  it('ends a jam and returns to lineup selector', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    // Start jam first
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    // End jam
    const endJamButton = screen.getByText('End Jam')
    fireEvent.click(endJamButton)
    
    await waitFor(() => {
      expect(screen.getByText('Jam 2 Lineup Selection')).toBeInTheDocument()
    })
  })

  it('updates player stats during jam', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    // Start jam
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    // Add points to a player
    const addPointButtons = screen.getAllByText('Add Point')
    fireEvent.click(addPointButtons[0])
    
    // Verify supabase update was called
    expect(mockSupabase.from).toHaveBeenCalledWith('player_stats')
  })

  it('ends bout and shows summary', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    // Start jam first
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    // End bout
    const endBoutButton = screen.getByText('End Bout')
    fireEvent.click(endBoutButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('bout-summary')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Bout Complete')).toBeInTheDocument()
    expect(screen.getByText('Score: 25 - 18')).toBeInTheDocument()
  })

  it('handles navigation back from bout summary', async () => {
    const mockOnNavigateBack = vi.fn()
    
    render(<LiveStatTracker boutId="bout-1" onNavigateBack={mockOnNavigateBack} />)
    
    // Start and immediately end bout to get to summary
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('End Bout'))
    
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
    
    // Get to bout summary
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('End Bout'))
    
    await waitFor(() => {
      expect(screen.getByTestId('bout-summary')).toBeInTheDocument()
    })
    
    // Click new bout
    fireEvent.click(screen.getByText('New Bout'))
    
    expect(mockOnNavigateBack).toHaveBeenCalled()
  })

  it('cancels lineup selection for subsequent jams', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    // Start and end first jam to get to jam 2
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Start Jam with Sample Lineup'))
    
    await waitFor(() => {
      expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('End Jam'))
    
    await waitFor(() => {
      expect(screen.getByText('Jam 2 Lineup Selection')).toBeInTheDocument()
    })
    
    // Cancel lineup selection (goes back to previous jam)
    fireEvent.click(screen.getByText('Cancel'))
    
    // After cancel, should still show live bout header but with jam 1
    expect(screen.getByTestId('live-bout-header')).toBeInTheDocument()
    expect(screen.getByText('Jam: 1')).toBeInTheDocument()
  })

  it('initializes player stats for new players', async () => {
    render(<LiveStatTracker boutId="bout-1" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('jam-lineup-selector')).toBeInTheDocument()
    })
    
    // Verify that upsert was called to initialize stats
    expect(mockSupabase.from).toHaveBeenCalledWith('player_stats')
  })

  it('handles database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject(new Error('Database connection failed'))
        })
      })
    }))

    render(<LiveStatTracker boutId="bout-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Loading bout data...')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})