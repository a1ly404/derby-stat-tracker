import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Auth } from '../components/Auth'

// Mock the requireSupabase function
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
  }
}

vi.mock('../lib/supabase', () => ({
  requireSupabase: vi.fn(() => mockSupabase)
}))

describe('Auth Component', () => {
  const mockOnAuthSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in form by default', () => {
    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    expect(screen.getByText('Sign In to Derby Stat Tracker')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('toggles to sign up form when link is clicked', async () => {
    const user = userEvent.setup()
    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(signUpButton)

    expect(screen.getByText('Sign Up to Derby Stat Tracker')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('handles successful sign in', async () => {
    const user = userEvent.setup()
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockOnAuthSuccess).toHaveBeenCalled()
    })
  })

  it('handles sign in error', async () => {
    const user = userEvent.setup()
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: new Error('Invalid credentials')
    })

    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles successful sign up', async () => {
    const user = userEvent.setup()
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })

    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    // Switch to sign up mode
    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(signUpButton)

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/password/i), 'newpassword123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'newpassword123'
      })
      expect(screen.getByText(/check your email for the confirmation link/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during authentication', async () => {
    const user = userEvent.setup()
    // Create a promise that we can control
    let resolveAuth: (value: { error: null }) => void
    const authPromise = new Promise<{ error: null }>(resolve => {
      resolveAuth = resolve
    })
    mockSupabase.auth.signInWithPassword.mockReturnValue(authPromise)

    render(<Auth onAuthSuccess={mockOnAuthSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Resolve the promise
    resolveAuth!({ error: null })

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalled()
    })
  })
})