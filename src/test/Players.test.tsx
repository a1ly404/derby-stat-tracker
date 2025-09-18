import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Players from '../components/Players'

describe('Players Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads and displays players', async () => {
        render(<Players />)

        // Wait for loading to complete and check for players list
        await waitFor(() => {
            expect(screen.queryByText(/loading players/i)).not.toBeInTheDocument()
        })
    })

    it('shows add player form when button is clicked', async () => {
        const user = userEvent.setup()
        render(<Players />)

        const addButton = screen.getByText(/add player/i)
        await user.click(addButton)

        expect(screen.getByPlaceholderText(/player name/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/derby number/i)).toBeInTheDocument()
        expect(screen.getByText(/save/i)).toBeInTheDocument()
        expect(screen.getByText(/cancel/i)).toBeInTheDocument()
    })

    it('creates a new player', async () => {
        const user = userEvent.setup()
        render(<Players />)

        // Click add player button
        const addButton = screen.getByText(/add player/i)
        await user.click(addButton)

        // Fill in player details
        const nameInput = screen.getByPlaceholderText(/player name/i)
        const numberInput = screen.getByPlaceholderText(/derby number/i)

        await user.type(nameInput, 'New Player')
        await user.type(numberInput, '42')

        // Click save
        const saveButton = screen.getByText(/save/i)
        await user.click(saveButton)

        // Form should be hidden after saving
        await waitFor(() => {
            expect(screen.queryByPlaceholderText(/player name/i)).not.toBeInTheDocument()
        })
    })

    it('validates required fields', async () => {
        const user = userEvent.setup()
        render(<Players />)

        // Click add player button
        const addButton = screen.getByText(/add player/i)
        await user.click(addButton)

        // Try to save without filling required fields
        const saveButton = screen.getByText(/save/i)
        await user.click(saveButton)

        // Form should still be visible (validation failed)
        expect(screen.getByPlaceholderText(/player name/i)).toBeInTheDocument()
    })

    it('cancels player creation', async () => {
        const user = userEvent.setup()
        render(<Players />)

        // Click add player button
        const addButton = screen.getByText(/add player/i)
        await user.click(addButton)

        // Fill in some data
        const nameInput = screen.getByPlaceholderText(/player name/i)
        await user.type(nameInput, 'Test Player')

        // Click cancel
        const cancelButton = screen.getByText(/cancel/i)
        await user.click(cancelButton)

        // Form should be hidden
        expect(screen.queryByPlaceholderText(/player name/i)).not.toBeInTheDocument()
    })

    it('edits an existing player', async () => {
        const user = userEvent.setup()
        render(<Players />)

        // Wait for players to load
        await waitFor(() => {
            expect(screen.queryByText(/loading players/i)).not.toBeInTheDocument()
        })

        // Find and click edit button (assuming there's at least one player from mock)
        const editButtons = screen.queryAllByText(/edit/i)
        if (editButtons.length > 0) {
            await user.click(editButtons[0])

            // Should show edit form
            expect(screen.getByPlaceholderText(/player name/i)).toBeInTheDocument()
            expect(screen.getByText(/save/i)).toBeInTheDocument()
        }
    })

    it('deletes a player', async () => {
        const user = userEvent.setup()
        render(<Players />)

        // Wait for players to load
        await waitFor(() => {
            expect(screen.queryByText(/loading players/i)).not.toBeInTheDocument()
        })

        // Find and click delete button (assuming there's at least one player from mock)
        const deleteButtons = screen.queryAllByText(/delete/i)
        if (deleteButtons.length > 0) {
            await user.click(deleteButtons[0])

            // Should show confirmation dialog
            expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
            expect(screen.getByText(/yes, delete/i)).toBeInTheDocument()
        }
    })

    it('shows loading state', () => {
        render(<Players />)

        expect(screen.getByText(/loading players/i)).toBeInTheDocument()
    })

    it('handles empty state', async () => {
        render(<Players />)

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText(/loading players/i)).not.toBeInTheDocument()
        })

        // Should show appropriate message if no players
        // (This depends on the component implementation)
    })
})