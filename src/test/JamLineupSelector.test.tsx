import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JamLineupSelector from '../components/JamLineupSelector'

const mockHomeTeamPlayers = [
  {
    id: 'player-1',
    derby_name: 'Jammer Jane',
    preferred_number: '1',
    team_number: '1',
    position: 'jammer',
    is_active: true,
    team_id: 'team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'player-2',
    derby_name: 'Pivot Pat',
    preferred_number: '2',
    team_number: '2',
    position: 'pivot',
    is_active: true,
    team_id: 'team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'player-3',
    derby_name: 'Block Betty',
    preferred_number: '3',
    team_number: '3',
    position: 'blocker',
    is_active: true,
    team_id: 'team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

const mockAwayTeamPlayers = [
  {
    id: 'player-4',
    derby_name: 'Away Jammer',
    preferred_number: '4',
    team_number: '4',
    position: 'jammer',
    is_active: true,
    team_id: 'team-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

describe('JamLineupSelector Component', () => {
  const mockOnStartJam = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders lineup selector interface', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getByText('Select Jam #1 Lineup')).toBeInTheDocument()
    expect(screen.getByText('Home Team (0/5)')).toBeInTheDocument()
    expect(screen.getByText('Away Team (0/5)')).toBeInTheDocument()
    expect(screen.getByText('Start Jam #1')).toBeInTheDocument()
  })

  it('displays player options for selection', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getByText('Jammer Jane')).toBeInTheDocument()
    expect(screen.getByText('Pivot Pat')).toBeInTheDocument()
    expect(screen.getByText('Block Betty')).toBeInTheDocument()
    expect(screen.getByText('Away Jammer')).toBeInTheDocument()
  })

  it('allows selecting players for lineup', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Initially start jam button should be disabled
    const startButton = screen.getByText('Start Jam #1')
    expect(startButton).toBeDisabled()

    // Click on a home team player
    fireEvent.click(screen.getByText('Jammer Jane'))
    
    // Click on an away team player
    fireEvent.click(screen.getByText('Away Jammer'))

    // Now start button should be enabled
    expect(startButton).not.toBeDisabled()
  })

  it('shows selected players in lineup display', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Select a player
    fireEvent.click(screen.getByText('Jammer Jane'))

    // Check that lineup count updated
    expect(screen.getByText('Home Team (1/5)')).toBeInTheDocument()
  })

  it('prevents selecting more than 5 players per team', () => {
    const manyPlayers = [
      ...mockHomeTeamPlayers,
      { id: 'player-5', derby_name: 'Player 5', team_number: '5', position: 'blocker', is_active: true, team_id: 'team-1', preferred_number: '5', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 'player-6', derby_name: 'Player 6', team_number: '6', position: 'blocker', is_active: true, team_id: 'team-1', preferred_number: '6', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      { id: 'player-7', derby_name: 'Player 7', team_number: '7', position: 'blocker', is_active: true, team_id: 'team-1', preferred_number: '7', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
    ]

    render(
      <JamLineupSelector
        homeTeamPlayers={manyPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Select 5 players
    fireEvent.click(screen.getByText('Jammer Jane'))
    fireEvent.click(screen.getByText('Pivot Pat'))
    fireEvent.click(screen.getByText('Block Betty'))
    fireEvent.click(screen.getByText('Player 5'))
    fireEvent.click(screen.getByText('Player 6'))

    // Lineup should show 5/5
    expect(screen.getByText('Home Team (5/5)')).toBeInTheDocument()

    // 6th player button should be disabled
    const player7Button = screen.getByText('Player 7').closest('button')
    expect(player7Button).toBeDisabled()
  })

  it('allows removing selected players', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Select a player
    fireEvent.click(screen.getByText('Jammer Jane'))
    expect(screen.getByText('Home Team (1/5)')).toBeInTheDocument()

    // Click again to deselect
    fireEvent.click(screen.getByText('Jammer Jane'))
    expect(screen.getByText('Home Team (0/5)')).toBeInTheDocument()
  })

  it('calls onStartJam with selected lineups', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Select players
    fireEvent.click(screen.getByText('Jammer Jane'))
    fireEvent.click(screen.getByText('Away Jammer'))

    // Click start jam
    fireEvent.click(screen.getByText('Start Jam #1'))

    expect(mockOnStartJam).toHaveBeenCalledWith(
      [mockHomeTeamPlayers[0]], // Selected home player
      [mockAwayTeamPlayers[0]]  // Selected away player
    )
  })

  it('shows validation message when not enough players selected', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getByText('Both teams must have at least 1 player to start the jam.')).toBeInTheDocument()

    // Select home team player only
    fireEvent.click(screen.getByText('Jammer Jane'))
    expect(screen.getByText('Both teams must have at least 1 player to start the jam.')).toBeInTheDocument()

    // Select away team player
    fireEvent.click(screen.getByText('Away Jammer'))
    expect(screen.queryByText('Both teams must have at least 1 player to start the jam.')).not.toBeInTheDocument()
  })

  it('displays player numbers and positions', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('#4')).toBeInTheDocument()
    
    expect(screen.getAllByText('jammer')).toHaveLength(2) // 2 jammers
    expect(screen.getByText('pivot')).toBeInTheDocument()
    expect(screen.getByText('blocker')).toBeInTheDocument()
  })

  it('shows cancel button for jams after first', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={2}
      />
    )

    expect(screen.getByText('Back to Previous Jam')).toBeInTheDocument()
  })

  it('does not show cancel button for first jam', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.queryByText('Back to Previous Jam')).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={2}
      />
    )

    fireEvent.click(screen.getByText('Back to Previous Jam'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('shows position emojis correctly', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    // Position emojis should be present
    expect(screen.getAllByText('⚡')).toHaveLength(2) // 2 jammers
    expect(screen.getByText('🔺')).toBeInTheDocument() // 1 pivot
    expect(screen.getByText('🛡️')).toBeInTheDocument() // 1 blocker
  })

  it('handles empty player arrays gracefully', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={[]}
        awayTeamPlayers={[]}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getAllByText('No active players found')).toHaveLength(2)
    expect(screen.getByText('Start Jam #1')).toBeDisabled()
  })

  it('shows scroll hint for many players', () => {
    const manyPlayers = Array.from({ length: 8 }, (_, i) => ({
      id: `player-${i + 1}`,
      derby_name: `Player ${i + 1}`,
      team_number: `${i + 1}`,
      position: 'blocker',
      is_active: true,
      team_id: 'team-1',
      preferred_number: `${i + 1}`,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }))

    render(
      <JamLineupSelector
        homeTeamPlayers={manyPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    expect(screen.getByText('👆 Scroll to see all players')).toBeInTheDocument()
  })

  it('displays correct jam number in title and button', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={5}
      />
    )

    expect(screen.getByText('Select Jam #5 Lineup')).toBeInTheDocument()
    expect(screen.getByText('Start Jam #5')).toBeInTheDocument()
  })

  it('shows selected players with correct styling', () => {
    render(
      <JamLineupSelector
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        onStartJam={mockOnStartJam}
        onCancel={mockOnCancel}
        currentJam={1}
      />
    )

    const playerButton = screen.getByText('Jammer Jane').closest('button')
    expect(playerButton).not.toHaveClass('selected')

    // Select the player
    fireEvent.click(screen.getByText('Jammer Jane'))
    
    expect(playerButton).toHaveClass('selected')
  })
})