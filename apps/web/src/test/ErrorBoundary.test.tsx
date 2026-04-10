import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error')
    }
    return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
    // Suppress console.error for these tests since we're intentionally throwing errors
    const originalConsoleError = console.error
    beforeAll(() => {
        console.error = vi.fn()
    })

    afterAll(() => {
        console.error = originalConsoleError
    })

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        )

        expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders error UI when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText(/configuration error/i)).toBeInTheDocument()
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    it('logs error to console when error occurs', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(consoleSpy).toHaveBeenCalledWith(
            'Uncaught error:',
            expect.any(Error),
            expect.any(Object)
        )

        consoleSpy.mockRestore()
    })

    it('shows error details when available', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Should show some kind of error information
        expect(screen.getByText(/configuration error/i)).toBeInTheDocument()
    })

    it('provides recovery instructions', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        // Should provide helpful instructions for recovery
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })
})