import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LiveBoutHeader from '../components/LiveBoutHeader'
import type { Bout, Team } from '../lib/supabase'

// Mock the CSS import
vi.mock('../components/LiveBoutHeader.css', () => ({}))

// Mock data
const mockHomeTeam: Team = {
  id: 'team-1',
  name: 'Team A',
  city: 'City A',
  logo_url: null,
  primary_color: '#ff0000',
  secondary_color: '#ffffff',
  created_at: '2024-01-01T00:00:00Z'
}

const mockAwayTeam: Team = {
  id: 'team-2', 
  name: 'Team B',
  city: 'City B',
  logo_url: null,
  primary_color: '#0000ff',
  secondary_color: '#ffffff',
  created_at: '2024-01-01T00:00:00Z'
}

const mockBout: Bout & { home_team: Team; away_team: Team } = {
  id: 'bout-1',
  home_team_id: 'team-1',
  away_team_id: 'team-2',
  home_score: 45,
  away_score: 32,
  status: 'live',
  current_jam: 5,
  current_period: 1,
  jam_active: false,
  start_time: '2024-01-01T19:00:00Z',
  end_time: null,
  venue: 'Test Arena',
  created_at: '2024-01-01T00:00:00Z',
  home_team: mockHomeTeam,
  away_team: mockAwayTeam
}

describe('LiveBoutHeader Component', () => {
  const mockOnStartJam = vi.fn()
  const mockOnEndJam = vi.fn()
  const mockOnEndBout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bout information correctly', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    expect(screen.getByText('Team A vs Team B')).toBeInTheDocument()
    expect(screen.getByText('45 - 32')).toBeInTheDocument()
    expect(screen.getByText('Jam #5')).toBeInTheDocument()
  })

  it('shows start button when jam is inactive', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    const startButton = screen.getByText('Start')
    expect(startButton).toBeInTheDocument()
    expect(startButton).toHaveClass('start')
  })

  it('shows end button when jam is active', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={true}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    const endButton = screen.getByText('End')
    expect(endButton).toBeInTheDocument()
    expect(endButton).toHaveClass('end')
  })

  it('calls onStartJam when start button is clicked', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}  
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    fireEvent.click(screen.getByText('Start'))
    expect(mockOnStartJam).toHaveBeenCalledTimes(1)
  })

  it('calls onEndJam when end button is clicked', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={true}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    fireEvent.click(screen.getByText('End'))
    expect(mockOnEndJam).toHaveBeenCalledTimes(1)
  })

  it('calls onEndBout when end bout button is clicked', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    fireEvent.click(screen.getByText('End Bout'))
    expect(mockOnEndBout).toHaveBeenCalledTimes(1)
  })

  it('displays timer correctly', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('shows inactive status dot when jam is inactive', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    const statusDot = document.querySelector('.status-dot')
    expect(statusDot).toHaveClass('inactive')
  })

  it('shows active status dot when jam is active', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={true}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    const statusDot = document.querySelector('.status-dot')
    expect(statusDot).toHaveClass('active')
  })

  it('handles zero scores correctly', () => {
    const boutWithZeroScores = {
      ...mockBout,
      home_score: 0,
      away_score: 0
    }

    render(
      <LiveBoutHeader
        bout={boutWithZeroScores}
        currentJam={1}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    expect(screen.getByText('0 - 0')).toBeInTheDocument()
  })

  it('handles null scores correctly', () => {
    const boutWithNullScores = {
      ...mockBout,
      home_score: null,
      away_score: null
    }

    render(
      <LiveBoutHeader
        bout={boutWithNullScores}
        currentJam={1}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    expect(screen.getByText('0 - 0')).toBeInTheDocument()
  })

  it('displays initial timer correctly when active', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={true}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    // Initial timer display
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('resets timer when start button is clicked', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    // Click start button - this should reset timer to 2:00
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('displays different jam numbers correctly', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={12}
        isJamActive={false}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    expect(screen.getByText('Jam #12')).toBeInTheDocument()
  })

  it('shows timer component exists', () => {
    render(
      <LiveBoutHeader
        bout={mockBout}
        currentJam={5}
        isJamActive={true}
        onStartJam={mockOnStartJam}
        onEndJam={mockOnEndJam}
        onEndBout={mockOnEndBout}
      />
    )

    // Timer component should be rendered
    const timerElement = document.querySelector('.jam-timer')
    expect(timerElement).toBeInTheDocument()
  })
})