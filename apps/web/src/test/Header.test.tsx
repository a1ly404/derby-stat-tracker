import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '../components/Header'

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
    useAuth: vi.fn()
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

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders app title', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<Header />)

        expect(screen.getByText('Derby Stat Tracker')).toBeInTheDocument()
    })

    it('displays current date', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<Header />)

        // Should show today's date
        const today = new Date().toLocaleDateString()
        expect(screen.getByText(today)).toBeInTheDocument()
    })

    it('shows user email when logged in', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<Header />)

        expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows sign out button when logged in', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<Header />)

        expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('calls signOut when sign out button is clicked', async () => {
        const mockSignOut = vi.fn()
        const user = userEvent.setup()

        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            session: null,
            loading: false,
            signOut: mockSignOut
        })

        render(<Header />)

        const signOutButton = screen.getByText('Sign Out')
        await user.click(signOutButton)

        expect(mockSignOut).toHaveBeenCalledOnce()
    })

    it('does not show user info when not logged in', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        render(<Header />)

        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
        expect(screen.queryByText('@')).not.toBeInTheDocument()
    })

    it('renders header with correct CSS class', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            session: null,
            loading: false,
            signOut: vi.fn()
        })

        const { container } = render(<Header />)

        expect(container.querySelector('.header')).toBeInTheDocument()
        expect(container.querySelector('.header-content')).toBeInTheDocument()
    })
})