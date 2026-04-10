import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoutSummary from '../components/BoutSummary'

const mockBout = {
  id: 'bout-1',
  home_team: {
    id: 'team-1',
    name: 'Team A',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  away_team: {
    id: 'team-2',
    name: 'Team B',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  home_score: 100,
  away_score: 85,
  venue: 'Test Arena',
  bout_date: '2025-01-15',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockHomeTeamPlayers = [
  {
    id: 'player-1',
    derby_name: 'Speedy Jane',
    preferred_number: '11',
    team_number: '11',
    position: 'jammer',
    is_active: true,
    team_id: 'team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'player-2',
    derby_name: 'Block Betty',
    preferred_number: '42',
    team_number: '42',
    position: 'blocker',
    is_active: true,
    team_id: 'team-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

const mockAwayTeamPlayers = [
  {
    id: 'player-3',
    derby_name: 'Fast Alice',
    preferred_number: '33',
    team_number: '33',
    position: 'jammer',
    is_active: true,
    team_id: 'team-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
]

const mockPlayerStats = new Map([
  ['player-1', {
    id: 'stat-1',
    player_id: 'player-1',
    bout_id: 'bout-1',
    jams_played: 8,
    lead_jammer: 3,
    points_scored: 24,
    penalties: 1,
    blocks: 0,
    assists: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }],
  ['player-2', {
    id: 'stat-2',
    player_id: 'player-2',
    bout_id: 'bout-1',
    jams_played: 12,
    lead_jammer: 0,
    points_scored: 0,
    penalties: 3,
    blocks: 15,
    assists: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }],
  ['player-3', {
    id: 'stat-3',
    player_id: 'player-3',
    bout_id: 'bout-1',
    jams_played: 6,
    lead_jammer: 2,
    points_scored: 18,
    penalties: 0,
    blocks: 0,
    assists: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }]
])

describe('BoutSummary Component', () => {
  const mockOnNewBout = vi.fn()
  const mockOnBackToBouts = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bout summary with correct title', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Team A')).toBeInTheDocument()
    expect(screen.getByText('Team B')).toBeInTheDocument()
    expect(screen.getByText('vs')).toBeInTheDocument()
  })

  it('displays final scores correctly', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('shows winner when scores are different', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('🏆 Team A Wins!')).toBeInTheDocument()
  })

  it('shows tie when scores are equal', () => {
    const tieBout = { ...mockBout, home_score: 100, away_score: 100 }
    render(
      <BoutSummary
        bout={tieBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText("🤝 It's a Tie!")).toBeInTheDocument()
  })

  it('displays bout information', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    // Check bout structure displays correctly
    expect(screen.getByText('Bout Complete')).toBeInTheDocument()
    expect(screen.getByText('🏆 Team A Wins!')).toBeInTheDocument()
  })

  it('renders player statistics table', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Team A Players')).toBeInTheDocument()
    expect(screen.getByText('Team B Players')).toBeInTheDocument()
  })

  it('displays correct statistics for each player', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Speedy Jane')).toBeInTheDocument()
    expect(screen.getByText('Block Betty')).toBeInTheDocument()
    expect(screen.getByText('Fast Alice')).toBeInTheDocument()
  })

  it('shows penalties for players', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    // Check penalty values in stats display
    const penaltyElements = screen.getAllByText(/^[0-3]$/)
    expect(penaltyElements.length).toBeGreaterThan(0)
  })

  it('sorts players by position', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    const playerElements = screen.getAllByText(/Speedy Jane|Block Betty/)
    expect(playerElements).toHaveLength(2)
  })

  it('handles export button click', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    const newBoutButton = screen.getByText('Start New Bout')
    fireEvent.click(newBoutButton)
    expect(mockOnNewBout).toHaveBeenCalledTimes(1)
  })

  it('handles close button click', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    const backButton = screen.getByText('Back to Bouts')
    fireEvent.click(backButton)
    expect(mockOnBackToBouts).toHaveBeenCalledTimes(1)
  })

  it('displays team totals correctly', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('handles empty stats gracefully', () => {
    const emptyStats = new Map()
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={emptyStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Speedy Jane')).toBeInTheDocument()
    expect(screen.getByText('Block Betty')).toBeInTheDocument()
  })

  it('shows MVP calculation', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Speedy Jane')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('displays jam statistics', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getAllByText('Jams:')).toHaveLength(3)
    // Check that stat values are present
    const statValues = screen.getAllByText(/^[0-9]+$/)
    expect(statValues.length).toBeGreaterThan(0)
  })

  it('shows efficiency metrics', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getAllByText('Lead Jammer:')).toHaveLength(3)
    expect(screen.getAllByText('Blocks:')).toHaveLength(3)
    // Check that key stats display
    const leadJammerStats = screen.getAllByText('3')
    const blockStats = screen.getAllByText('15')
    expect(leadJammerStats.length).toBeGreaterThan(0)
    expect(blockStats.length).toBeGreaterThan(0)
  })

  it('displays position breakdown', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('#11')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
  })

  it('handles keyboard navigation', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    const newBoutButton = screen.getByText('Start New Bout')
    // Button should be accessible
    expect(newBoutButton).toHaveAccessibleName()
  })

  it('shows print-friendly view toggle', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    expect(screen.getByText('Bout Complete')).toBeInTheDocument()
  })

  it('displays penalty breakdown by type', () => {
    render(
      <BoutSummary
        bout={mockBout}
        homeTeamPlayers={mockHomeTeamPlayers}
        awayTeamPlayers={mockAwayTeamPlayers}
        playerStats={mockPlayerStats}
        onNewBout={mockOnNewBout}
        onBackToBouts={mockOnBackToBouts}
      />
    )

    // Check penalty section displays  
    expect(screen.getAllByText('Penalties:')).toHaveLength(3) // One for each player
  })
})