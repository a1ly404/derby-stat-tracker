import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigurationError } from '../components/ConfigurationError'

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
})

describe('ConfigurationError', () => {
  it('renders error message correctly', () => {
    render(<ConfigurationError error="Test error message" />)

    expect(screen.getByText('🚨 Configuration Error')).toBeInTheDocument()
    expect(screen.getByText(/Derby Stat Tracker is not properly configured/)).toBeInTheDocument()
  })

  it('shows technical details when expanded', () => {
    render(<ConfigurationError error="Test error message" />)

    const detailsButton = screen.getByText('Technical Details')
    fireEvent.click(detailsButton)

    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument()
    expect(screen.getByText('VITE_SUPABASE_ANON_KEY')).toBeInTheDocument()
  })

  it('displays custom error message when provided', () => {
    render(<ConfigurationError error="Custom error message" />)

    const detailsButton = screen.getByText('Technical Details')
    fireEvent.click(detailsButton)

    expect(screen.getByText('Error: Custom error message')).toBeInTheDocument()
  })

  it('calls window.location.reload when retry button is clicked', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload')

    render(<ConfigurationError error="Test error" />)

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    expect(reloadSpy).toHaveBeenCalled()
  })
})