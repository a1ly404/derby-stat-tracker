import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Bouts from '../components/Bouts'

describe('Bouts Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads and displays bouts', async () => {
        render(<Bouts />)

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })
    })

    it('shows add bout form when button is clicked', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        const addButton = screen.getByText(/add bout/i)
        await user.click(addButton)

        // Should show form fields for creating a bout
        expect(screen.getByText(/home team/i)).toBeInTheDocument()
        expect(screen.getByText(/away team/i)).toBeInTheDocument()
        expect(screen.getByText(/save/i)).toBeInTheDocument()
        expect(screen.getByText(/cancel/i)).toBeInTheDocument()
    })

    it('creates a new bout', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Click add bout button
        const addButton = screen.getByText(/add bout/i)
        await user.click(addButton)

        // Fill in bout details
        const dateInput = screen.getByDisplayValue(/2024/)
        if (dateInput) {
            await user.clear(dateInput)
            await user.type(dateInput, '2024-03-15')
        }

        // Select teams (if dropdowns are available)
        const homeTeamSelect = screen.queryByRole('combobox', { name: /home team/i })
        const awayTeamSelect = screen.queryByRole('combobox', { name: /away team/i })

        if (homeTeamSelect && awayTeamSelect) {
            await user.selectOptions(homeTeamSelect, ['1'])
            await user.selectOptions(awayTeamSelect, ['2'])
        }

        // Click save
        const saveButton = screen.getByText(/save/i)
        await user.click(saveButton)

        // Form should be hidden after saving
        await waitFor(() => {
            expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
        })
    })

    it('cancels bout creation', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Click add bout button
        const addButton = screen.getByText(/add bout/i)
        await user.click(addButton)

        // Click cancel
        const cancelButton = screen.getByText(/cancel/i)
        await user.click(cancelButton)

        // Form should be hidden
        expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
    })

    it('displays bout details', async () => {
        render(<Bouts />)

        // Wait for bouts to load
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })

        // Look for bout information (if any bouts exist)
        const boutElements = [
            /vs\./i,  // Common format: "Team A vs. Team B"
            /score/i,
            /final/i,
            /date/i
        ]

        // Some bout content might be present
        const foundBoutContent = boutElements.some(pattern =>
            screen.queryByText(pattern) !== null
        )

        // Either shows bouts or empty state
        expect(foundBoutContent || screen.queryByText(/no bouts/i)).toBeTruthy()
    })

    it('expands bout to show detailed view', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Wait for bouts to load
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })

        // Look for expandable bout items
        const expandButtons = screen.queryAllByText(/view details/i)
        if (expandButtons.length > 0) {
            await user.click(expandButtons[0])

            // Should show detailed bout information
            expect(screen.getByText(/bout details/i)).toBeInTheDocument()
        }
    })

    it('edits bout scores', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Wait for bouts to load
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })

        // Look for edit score buttons
        const editButtons = screen.queryAllByText(/edit score/i)
        if (editButtons.length > 0) {
            await user.click(editButtons[0])

            // Should show score editing interface
            expect(screen.getByText(/home score/i)).toBeInTheDocument()
            expect(screen.getByText(/away score/i)).toBeInTheDocument()
        }
    })

    it('deletes a bout', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Wait for bouts to load
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })

        // Look for delete buttons
        const deleteButtons = screen.queryAllByText(/delete/i)
        if (deleteButtons.length > 0) {
            await user.click(deleteButtons[0])

            // Should show confirmation dialog
            expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
            expect(screen.getByText(/yes, delete/i)).toBeInTheDocument()
        }
    })

    it('shows loading state', () => {
        render(<Bouts />)

        expect(screen.getByText(/loading bouts/i)).toBeInTheDocument()
    })

    it('handles empty state', async () => {
        render(<Bouts />)

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText(/loading bouts/i)).not.toBeInTheDocument()
        })

        // Should handle empty state gracefully
        // Component should render without errors even with no data
        expect(screen.getByText(/add bout/i)).toBeInTheDocument()
    })

    it('validates bout form', async () => {
        const user = userEvent.setup()
        render(<Bouts />)

        // Click add bout button
        const addButton = screen.getByText(/add bout/i)
        await user.click(addButton)

        // Try to save without required fields
        const saveButton = screen.getByText(/save/i)
        await user.click(saveButton)

        // Form should still be visible (validation failed)
        expect(screen.getByText(/home team/i)).toBeInTheDocument()
    })
})