import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock the hooks and components
vi.mock('../hooks/useAuth', () => ({
    useAuth: vi.fn()
}))

vi.mock('../lib/supabase', () => ({
    isSupabaseConfigured: true,
    requireSupabase: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    data: [],
                    error: null
                }))
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => ({
                        data: null,
                        error: null
                    }))
                }))
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    data: null,
                    error: null
                }))
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    data: null,
                    error: null
                }))
            }))
        }))
    }))
}))

import { useAuth } from '../hooks/useAuth'

const mockUser = {
    id: '1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
}

const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600,
    token_type: 'bearer'
}

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading state when auth is loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: true,
            signOut: vi.fn()
        })

        render(<App />)

        expect(screen.getByText(/loading derby stat tracker/i)).toBeInTheDocument()
    })

    it('shows auth component when user is not logged in', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<App />)

        expect(screen.getByText(/sign in to derby stat tracker/i)).toBeInTheDocument()
    })

    it('shows main app when user is logged in', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            session: mockSession,
            loading: false,
            signOut: vi.fn()
        })

        render(<App />)

        // Should show navigation and main content
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        expect(screen.getByText('Derby Stat Tracker')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('switches between different views', async () => {
        const user = userEvent.setup()

        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            session: mockSession,
            loading: false,
            signOut: vi.fn()
        })

        render(<App />)

        // Click on Teams navigation
        const teamsNav = screen.getByRole('button', { name: /teams/i })
        await user.click(teamsNav)

        // Should show teams content - look for specific Teams content
        expect(screen.getByText('Teams Management')).toBeInTheDocument()

        // Click on Players navigation
        const playersNav = screen.getByRole('button', { name: /players/i })
        await user.click(playersNav)

        // Should show players content - look for specific Players content
        expect(screen.getByText('Players Management')).toBeInTheDocument()

        // Click on Bouts navigation
        const boutsNav = screen.getByRole('button', { name: /bouts/i })
        await user.click(boutsNav)

        // Should show bouts content - look for specific Bouts content
        expect(screen.getByText('Bout Management')).toBeInTheDocument()
    })

    it('handles auth success callback', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<App />)

        // The Auth component should receive the onAuthSuccess callback
        expect(screen.getByText(/sign in to derby stat tracker/i)).toBeInTheDocument()
    })
})