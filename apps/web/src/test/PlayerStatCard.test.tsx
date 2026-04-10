import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlayerStatCard from '../components/PlayerStatCard'

// Mock StatButton component
interface MockStatButtonProps {
  label: string
  value: number
  onIncrement: () => void
  onDecrement: () => void
  canDecrement?: boolean
}

vi.mock('../components/StatButton', () => ({
  default: ({ label, value, onIncrement, onDecrement, canDecrement = true }: MockStatButtonProps) => (
    <div data-testid={`stat-button-${label}`}>
      <span>{label}: {value}</span>
      <button onClick={onIncrement} data-testid={`increment-${label}`}>+</button>
      {canDecrement && <button onClick={onDecrement} data-testid={`decrement-${label}`}>-</button>}
    </div>
  )
}))

const mockPlayer = {
  id: 'player-1',
  derby_name: 'Test Skater',
  preferred_number: '42',
  team_number: '42',
  position: 'jammer',
  is_active: true,
  team_id: 'team-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockStats = {
  id: 'stat-1',
  player_id: 'player-1',
  bout_id: 'bout-1',
  jams_played: 3,
  lead_jammer: 1,
  points_scored: 8,
  penalties: 2,
  blocks: 5,
  assists: 3,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

describe('PlayerStatCard Component', () => {
  const mockOnStatUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders player information correctly', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('Test Skater')).toBeInTheDocument()
    expect(screen.getByText('jammer')).toBeInTheDocument() // Position badge shows full text
  })

  it('displays quick stats correctly', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Stats are displayed as separate elements - test labels which are unique
    expect(screen.getByText('Jams')).toBeInTheDocument() // Jams label
    expect(screen.getByText('8')).toBeInTheDocument() // Points value  
    expect(screen.getByText('Pts')).toBeInTheDocument() // Points label
    expect(screen.getByText('Ast')).toBeInTheDocument() // Assists label
    expect(screen.getByText('2')).toBeInTheDocument() // Penalties value
    expect(screen.getByText('Pen')).toBeInTheDocument() // Penalties label
    
    // Test the specific jams value (which appears twice - as jams and assists)
    const jamElements = screen.getAllByText('3')
    expect(jamElements).toHaveLength(2) // Jams (3) and Assists (3)
  })

  it('shows position-specific stats for jammers', () => {
    render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'jammer' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    expect(screen.getByText(/Points\s*:\s*8/)).toBeInTheDocument() // StatButton label
    expect(screen.getByText('Lead')).toBeInTheDocument() // Lead jammer checkbox
  })

  it('shows position-specific stats for blockers', () => {
    render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'blocker' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    expect(screen.getByText(/Blocks\s*:\s*5/)).toBeInTheDocument() // StatButton label
    expect(screen.getByText(/Assists\s*:\s*3/)).toBeInTheDocument() // StatButton label
    // Blockers don't get the jammer-specific Points button in the jammer section
  })

  it('shows pivot star passing controls for pivots', () => {
    render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'pivot' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={true}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    expect(screen.getByText('Has Star')).toBeInTheDocument() // Pivot star checkbox
  })

  it('handles stat updates correctly', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={true} // Need jam to be active for buttons to work
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    // Increment points using the actual button
    const incrementButton = screen.getByTestId('increment-Points')
    fireEvent.click(incrementButton)

    expect(mockOnStatUpdate).toHaveBeenCalledWith('points_scored', 1)
  })

  it('handles stat decrements correctly', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={true} // Need jam to be active for buttons to work
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    // Decrement points using the actual button
    const decrementButton = screen.getByTestId('decrement-Points')
    fireEvent.click(decrementButton)

    expect(mockOnStatUpdate).toHaveBeenCalledWith('points_scored', -1)
  })

  it('handles pivot star passing toggle', () => {
    render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'pivot' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={true}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    // Toggle star pass checkbox - this just shows/hides points button, doesn't update stats directly
    const starPassCheckbox = screen.getByLabelText('Has Star')
    fireEvent.click(starPassCheckbox)

    // After checking star pass, should show points button
    expect(screen.getByTestId('stat-button-Points')).toBeInTheDocument()
  })

  it('expands and collapses correctly', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Initially collapsed - no expanded stats visible
    expect(screen.queryByText('Points')).not.toBeInTheDocument()

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)
    expect(screen.getByText(/Points\s*:\s*8/)).toBeInTheDocument() // StatButton label with value

    // Click to collapse
    fireEvent.click(card!)
    expect(screen.queryByText(/Points\s*:\s*8/)).not.toBeInTheDocument()
  })

  it('applies jam-active styling', () => {
    const { container } = render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={true}
      />
    )

    expect(container.firstChild).toHaveClass('jam-active')
  })

  it('handles missing stats gracefully', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={undefined}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Should show 0 values for all stats when stats is undefined
    const statValues = screen.getAllByText('0')
    expect(statValues.length).toBeGreaterThan(0) // Should have multiple 0 values for different stats
    expect(screen.getByText('Jams')).toBeInTheDocument()
    expect(screen.getByText('Pts')).toBeInTheDocument()
  })

  it('displays correct position badge colors', () => {
    // Test jammer
    const { rerender } = render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'jammer' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )
    expect(screen.getByText('jammer')).toBeInTheDocument()

    // Test pivot  
    rerender(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'pivot' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )
    expect(screen.getByText('pivot')).toBeInTheDocument()

    // Test blocker
    rerender(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'blocker' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )
    expect(screen.getByText('blocker')).toBeInTheDocument()
  })

  it('shows penalty add button when expanded', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    expect(screen.getByText('Add Penalty')).toBeInTheDocument()
  })

  it('handles penalty addition', () => {
    render(
      <PlayerStatCard
        player={mockPlayer}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Click to expand (click on the card div)
    const card = screen.getByText('Test Skater').closest('.player-stat-card')
    fireEvent.click(card!)

    // Add penalty
    const addPenaltyButton = screen.getByText('Add Penalty')
    fireEvent.click(addPenaltyButton)

    expect(mockOnStatUpdate).toHaveBeenCalledWith('penalties', 1)
  })

  it('shows correct quick stats for blockers', () => {
    const { container } = render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'blocker' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    // Blockers should show blocks instead of points in quick stats
    expect(screen.getByText('Jams')).toBeInTheDocument() // Jams label
    expect(screen.getByText('5')).toBeInTheDocument() // Blocks value
    expect(screen.getByText('Blks')).toBeInTheDocument() // Blocks label (abbreviated)
    expect(screen.getByText('Ast')).toBeInTheDocument() // Assists label
    expect(screen.getByText('2')).toBeInTheDocument() // Penalties value
    expect(screen.getByText('Pen')).toBeInTheDocument() // Penalties label
    
    // Check for specific stat values in their proper context
    const quickStats = container.querySelectorAll('.quick-stat')
    expect(quickStats).toHaveLength(4)
    expect(quickStats[0]).toHaveTextContent('3Jams') // Jams
    expect(quickStats[1]).toHaveTextContent('5Blks') // Blocks  
    expect(quickStats[2]).toHaveTextContent('3Ast')  // Assists
    expect(quickStats[3]).toHaveTextContent('2Pen')  // Penalties
  })

  it('handles position color mapping correctly', () => {
    const { container } = render(
      <PlayerStatCard
        player={{ ...mockPlayer, position: 'jammer' }}
        stats={mockStats}
        onStatUpdate={mockOnStatUpdate}
        isJamActive={false}
      />
    )

    const positionBadge = container.querySelector('.player-position')
    expect(positionBadge).toHaveStyle({ backgroundColor: '#ff6b6b' }) // Jammer color
  })
})