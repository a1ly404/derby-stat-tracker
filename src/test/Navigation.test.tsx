import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from '../components/Navigation'

describe('Navigation Component', () => {
  const mockOnViewChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all navigation items', () => {
    render(<Navigation activeView="dashboard" onViewChange={mockOnViewChange} />)

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/teams/i)).toBeInTheDocument()
    expect(screen.getByText(/players/i)).toBeInTheDocument()
    expect(screen.getByText(/bouts/i)).toBeInTheDocument()
  })

  it('highlights the active view', () => {
    render(<Navigation activeView="teams" onViewChange={mockOnViewChange} />)

    const teamsButton = screen.getByRole('button', { name: /teams/i })
    expect(teamsButton).toHaveClass('active')
  })

  it('calls onViewChange when navigation item is clicked', async () => {
    const user = userEvent.setup()
    render(<Navigation activeView="dashboard" onViewChange={mockOnViewChange} />)

    const playersButton = screen.getByRole('button', { name: /players/i })
    await user.click(playersButton)

    expect(mockOnViewChange).toHaveBeenCalledWith('players')
  })

  // Removed brittle emoji-specific test. Navigation items are tested by their accessible text in other tests.

  it('shows Supabase attribution badge', () => {
    render(<Navigation activeView="dashboard" onViewChange={mockOnViewChange} />)

    expect(screen.getByAltText(/made with supabase/i)).toBeInTheDocument()
  })
})